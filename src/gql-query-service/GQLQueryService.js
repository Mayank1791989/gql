/* @flow */
import path from 'path';
import fs from 'fs';

import { Source } from 'graphql';

import {
  type GQLLocation,
  type GQLHint,
  type GQLInfo,
  type CommandParams,
} from 'gql-shared/types';
import EventEmitter from 'gql-shared/emitter';
import { memoize, memoizeSingle } from 'gql-shared/memoize';
import { type GQLError } from 'gql-shared/GQLError';
import GQLBaseService from 'gql-shared/GQLBaseService';
import { GQLSchema } from 'gql-shared/GQLSchema';
import GQLConfig from 'gql-config';
import { type QueryConfigResolved } from 'gql-config/types';
import { validate } from 'gql-shared/GQLValidate';

import QueryContext from './shared/QueryContext';

import GQLFragmentsManager from 'gql-shared/GQLFragmentsManager';
import { parseQueryFile, ParsedQueryFile } from 'gql-shared/GQLQueryFile';
import presetExtendSchema from 'gql-shared/presetExtendSchema';
import Providers from 'gql-shared/Providers';
import log from 'gql-shared/log';
import GQLWatcher, { type WatchFile, type Watcher } from 'gql-watcher';
import GQLSchemaService from 'gql-schema-service';

import getDefinitionAtPosition from './providers/getDefinitionAtPosition';
import getHintsAtPosition from './providers/getHintsAtPosition';
import getInfoOfTokenAtPosition from './providers/getInfoOfTokenAtPosition';
import findRefsOfTokenAtPosition from './providers/findRefsOfTokenAtPosition';
import getValidationRules from './providers/getValidationRules';
import { type ProviderParams } from './providers/types';

import QueryTokenTypeInfo from './shared/QueryTokenTypeInfo';

import invariant from 'invariant';

type Options = {
  config: GQLConfig,
  schemaService: GQLSchemaService,
  watcher: GQLWatcher,
};

const logger = log.getLogger('gql-query-service');

export class GQLQueryService extends GQLBaseService {
  _emitter = new EventEmitter();
  _initialized: boolean = false;
  _config: GQLConfig;
  _errors: Array<GQLError> = [];
  _parsedFilesMap: Map<string, ParsedQueryFile> = new Map();
  _fragmentsManager: GQLFragmentsManager = new GQLFragmentsManager();
  _options: Options;
  _schemaService: GQLSchemaService;

  _watchers: $ReadOnlyArray<Watcher> = [];

  providers = new Providers<ProviderParams>();

  constructor(options: Options) {
    super();
    this._options = options;
    this._config = options.config;
    this._schemaService = options.schemaService;
    this._registerProviders();
  }

  // commands
  getDefinitionAtPosition(params: CommandParams): $ReadOnlyArray<GQLLocation> {
    return this._catchThrownErrors(() => {
      const defs = [];
      const queryConfig = this._getConfig();
      queryConfig.files.forEach(fileOptions => {
        if (!this._match(params.source.name, fileOptions.match)) {
          return;
        }
        const context = this._newQueryContext(this._schemaService.getSchema())(
          fileOptions,
        );

        const token = context
          .getParser()
          .getTokenAtPosition(params.source, params.position);

        if (token) {
          defs.push(
            ...this.providers.provideDefinitions({
              token,
              typeInfo: new QueryTokenTypeInfo(context, token.state),
              context,
              source: params.source,
              position: params.position,
            }),
          );
        }
      });
      return defs;
    }, []);
  }

  getInfoOfTokenAtPosition(params: CommandParams): $ReadOnlyArray<GQLInfo> {
    return this._catchThrownErrors(() => {
      const info = [];
      const queryConfig = this._getConfig();
      queryConfig.files.forEach(fileOptions => {
        if (!this._match(params.source.name, fileOptions.match)) {
          return;
        }
        const context = this._newQueryContext(this._schemaService.getSchema())(
          fileOptions,
        );

        const token = context
          .getParser()
          .getTokenAtPosition(params.source, params.position);

        if (token) {
          info.push(
            ...this.providers.provideInfo({
              token,
              typeInfo: new QueryTokenTypeInfo(context, token.state),
              context,
              source: params.source,
              position: params.position,
            }),
          );
        }
      });
      return info;
    }, []);
  }

  getHintsAtPosition(params: CommandParams): $ReadOnlyArray<GQLHint> {
    return this._catchThrownErrors(() => {
      const hints = [];
      const queryConfig = this._getConfig();
      queryConfig.files.forEach(fileOptions => {
        if (!this._match(params.source.name, fileOptions.match)) {
          return;
        }

        const context = this._newQueryContext(this._schemaService.getSchema())(
          fileOptions,
        );

        const token = context
          .getParser()
          .getTokenAtPosition(params.source, params.position);

        if (token) {
          hints.push(
            ...this.providers.provideHints({
              token,
              typeInfo: new QueryTokenTypeInfo(context, token.state),
              context,
              source: params.source,
              position: params.position,
            }),
          );
        }
      });
      return hints;
    }, []);
  }

  findRefsOfTokenAtPosition(
    params: CommandParams,
  ): $ReadOnlyArray<GQLLocation> {
    return this._catchThrownErrors(() => {
      const refs = [];
      const queryConfig = this._getConfig();
      queryConfig.files.forEach(fileOptions => {
        if (!this._match(params.source.name, fileOptions.match)) {
          return;
        }

        const context = this._newQueryContext(this._schemaService.getSchema())(
          fileOptions,
        );

        const token = context
          .getParser()
          .getTokenAtPosition(params.source, params.position);

        if (token) {
          refs.push(
            ...this.providers.provideRefs({
              token,
              typeInfo: new QueryTokenTypeInfo(context, token.state),
              context,
              source: params.source,
              position: params.position,
            }),
          );
        }
      });
      return refs;
    }, []);
  }

  getErrors(): $ReadOnlyArray<GQLError> {
    return this._errors;
  }

  // private methods
  async _handleStart() {
    const queryConfig = this._getConfig();

    await this._schemaService.onReady();

    // setup watchers and wait for watch to start
    const watchers = [];
    await Promise.all(
      queryConfig.files.map(fileConfig => {
        const watcher = this._options.watcher.watch({
          rootPath: this._config.getDir(),
          files: fileConfig.match,
          onChange: (files: Array<WatchFile>) => {
            try {
              this._updateFiles(files, fileConfig);
              this._emitter.emit('change');
            } catch (e) {
              this._emitter.emit('error', e);
            }
          },
        });
        watchers.push(watcher);
        return watcher.onReady();
      }),
    );
    this._watchers = watchers;

    this._schemaService.onChangeSchema(() => {
      logger.info(
        `Schema changed. Re-validating ${this._parsedFilesMap.size} query files.`,
      );

      this._findErrors();
      // report change to update errors
      this._emitter.emit('change');
    });
  }

  async _handleStop() {
    this._watchers.forEach(watcher => {
      watcher.close();
    });
    this._watchers = [];
    this._isRunning = false;
    await Promise.resolve();
  }

  _updateFiles(files: Array<WatchFile>, config: QueryConfigResolved) {
    if (files.length === 0) {
      return;
    }

    // console.time('updating files');
    files.forEach(({ name, exists }) => {
      // console.log(name, exists);
      const absPath = path.join(this._config.getDir(), name);
      if (exists) {
        // console.time('parseFile');
        this._parsedFilesMap.set(absPath, this._parseFile(absPath, config));
        // console.timeEnd('parseFile');
      } else {
        this._parsedFilesMap.delete(absPath);
      }
    });
    // console.timeEnd('updating files');

    // update fragments (fragments should be updated before validation)
    this._fragmentsManager.updateFragments(this._parsedFilesMap);

    // validate and find errors
    this._findErrors();
  }

  _findErrors = () => {
    const errors: Array<GQLError> = [];
    this._parsedFilesMap.forEach(parsedFile => {
      if (parsedFile.isEmpty()) {
        return;
      }

      const context = this._newQueryContext(this._schemaService.getSchema())(
        parsedFile.getConfig(),
      );

      parsedFile.getDocuments().forEach(query => {
        const parseError = query.getParseError();
        if (parseError) {
          errors.push(parseError);
        } else {
          // const { ast } = query;
          // invariant(ast, '[unexpected error] ast should exists here');
          const validationErrors = validate(
            context,
            query.getNode(),
            getValidationRules({
              context,
              queryDocument: query,
            }),
          );
          if (validationErrors) {
            errors.push(...validationErrors);
          }
        }
      });
    });

    this._errors = errors;
  };

  _parseFile = (absPath: string, config: QueryConfigResolved) => {
    const content = fs.readFileSync(absPath, 'utf8');
    const source = new Source(content, absPath);
    return parseQueryFile(source, config);
  };

  _newQueryContext = memoizeSingle((schema: GQLSchema) => {
    return memoize((config: QueryConfigResolved) => {
      const Context = config.QueryContext || QueryContext;
      return new Context(
        config.extendSchema.length > 0
          ? this._extendSchema(schema)(config)
          : schema,
        this._fragmentsManager,
        config,
      );
    });
  });

  _extendSchema = memoizeSingle((schema: GQLSchema) =>
    // memoize per config extended schema
    memoize((fileConfig: QueryConfigResolved): GQLSchema =>
      this._catchThrownErrors(() => {
        return presetExtendSchema(
          schema,
          fileConfig.extendSchema,
          this._config.getGraphQLParseOptions(),
          this._config.getGraphQLBuildSchemaOptions(),
        );
      }, schema),
    ),
  );

  _getConfig() {
    const config = this._options.config.getQueryConfig();
    invariant(config, 'query config should be defined here');
    return config;
  }

  _match(filePath: string, match: $FixMe) {
    return this._options.config.match(filePath, match);
  }

  _registerProviders() {
    this.providers.registerDefinitionProvider(getDefinitionAtPosition);
    this.providers.registerHintsProvider(getHintsAtPosition);
    this.providers.registerInfoProvider(getInfoOfTokenAtPosition);
    this.providers.registerRefsProvider(findRefsOfTokenAtPosition);
  }
}

export default GQLQueryService;
