/* @flow */
import path from 'path';
import fs from 'fs';

import { Source } from 'graphql';
import GQLWatcher from 'gql-watcher';

import {
  type GQLLocation,
  type GQLHint,
  type GQLInfo,
  type GQLPosition,
} from 'gql-shared/types';
import EventEmitter from 'gql-shared/emitter';
import { memoize, memoizeSingle } from 'gql-shared/memoize';
import { type GQLError } from 'gql-shared/GQLError';
import GQLBaseService from 'gql-shared/GQLBaseService';
import { GQLSchema } from 'gql-shared/GQLSchema';
import GQLConfig from 'gql-config';
import { type QueryConfigResolved } from 'gql-config/types';

import queryValidate from './shared/queryValidate';
import QueryContext from './shared/QueryContext';

import GQLFragmentsManager from 'gql-shared/GQLFragmentsManager';
import { parseQueryFile, ParsedQueryFile } from 'gql-shared/GQLQueryFile';
import presetExtendSchema from 'gql-shared/presetExtendSchema';
import { type WatchFile } from 'gql-watcher';
import GQLSchemaService from 'gql-schema-service';

import getDefinitionAtPosition from './commands/getDefinitionAtPosition';
import getHintsAtPosition from './commands/getHintsAtPosition';
import getInfoOfTokenAtPosition from './commands/getInfoOfTokenAtPosition';
import findRefsOfTokenAtPosition from './commands/findRefsOfTokenAtPosition';
import log from 'gql-shared/log';

type CommandParams = {
  filePath: string,
  fileContent: string,
  fileOptions: QueryConfigResolved,
  position: GQLPosition,
};

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

  _watchers: * = [];

  constructor(options: Options) {
    super();
    this._options = options;
    this._config = options.config;
    this._schemaService = options.schemaService;
  }

  // commands
  getDefinitionAtPosition(params: CommandParams): ?GQLLocation {
    return this._catchThrownErrors(() => {
      return getDefinitionAtPosition({
        context: this._newQueryContext(this._schemaService.getSchema())(
          params.fileOptions,
        ),
        source: new Source(params.fileContent, params.filePath),
        position: params.position,
      });
    }, null);
  }

  getInfoOfTokenAtPosition(params: CommandParams): ?GQLInfo {
    return this._catchThrownErrors(() => {
      return getInfoOfTokenAtPosition({
        context: this._newQueryContext(this._schemaService.getSchema())(
          params.fileOptions,
        ),
        source: new Source(params.fileContent, params.filePath),
        position: params.position,
      });
    }, null);
  }

  getHintsAtPosition(params: CommandParams): Array<GQLHint> {
    return this._catchThrownErrors(() => {
      return getHintsAtPosition({
        context: this._newQueryContext(this._schemaService.getSchema())(
          params.fileOptions,
        ),
        source: new Source(params.fileContent, params.filePath),
        position: params.position,
      });
    }, []);
  }

  findRefsOfTokenAtPosition(params: CommandParams): Array<GQLLocation> {
    return this._catchThrownErrors(() => {
      return findRefsOfTokenAtPosition({
        context: this._newQueryContext(this._schemaService.getSchema())(
          params.fileOptions,
        ),
        source: new Source(params.fileContent, params.filePath),
        position: params.position,
      });
    }, []);
  }

  getErrors(): Array<GQLError> {
    return this._errors;
  }

  // private methods
  async _handleStart() {
    const queryConfig = this._config.getQueryConfig();
    if (!queryConfig) {
      return;
    }

    // setup watchers and wait for watch to start
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
        this._watchers.push(watcher);
        return watcher.onReady();
      }),
    );

    this._schemaService.onChange(() => {
      logger.info(
        `Schema changed. Re-validating ${
          this._parsedFilesMap.size
        } query files.`,
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
          const validationErrors = queryValidate(context, query);
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
    memoize(
      (fileConfig: QueryConfigResolved): GQLSchema =>
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
}

export default GQLQueryService;
