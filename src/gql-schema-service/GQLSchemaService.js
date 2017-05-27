/* @flow */
import path from 'path';
import fs from 'fs';

import {
  Source,
  GraphQLSchema,
  buildASTSchema as buildASTGraphQLSchema,
  type DocumentNode,
  assertValidSchema,
} from 'graphql';

import { newGQLError, type GQLError, SEVERITY } from 'gql-shared/GQLError';
import GQLBaseService from 'gql-shared/GQLBaseService';
import {
  type GQLHint,
  type GQLInfo,
  type GQLLocation,
  type CommandParams,
  type ISchemaPlugin,
} from 'gql-shared/types';
import { buildASTSchema, GQLSchema } from 'gql-shared/GQLSchema';
import presetExtendSchema from 'gql-shared/presetExtendSchema';
import { parseSchemaFile, ParsedSchemaFile } from 'gql-shared/GQLSchemaFile';
import { memoizeSingle } from 'gql-shared/memoize';
import Providers from 'gql-shared/Providers';
import { validate } from 'gql-shared/GQLValidate';
import { type EmitterSubscription } from 'gql-shared/emitter';

// providers
import findRefsOfTokenAtPosition from './providers/findRefsOfTokenAtPosition';
import getDefinitionAtPosition from './providers/getDefinitionAtPosition';
import getHintsAtPosition from './providers/getHintsAtPosition';
import getInfoOfTokenAtPosition from './providers/getInfoOfTokenAtPosition';
import getValidationRules from './providers/getValidationRules';
import { type ProviderParams } from './providers/types';

import SchemaContext from './shared/SchemaContext';

import GQLConfig from 'gql-config';
import GQLWatcher, { type WatchFile, type Watcher } from 'gql-watcher';

type Options = {|
  config: GQLConfig,
  watcher: GQLWatcher,
|};

type ParsedFilesMap = Map<string, ParsedSchemaFile>;

export default class GQLSchemaService extends GQLBaseService {
  _schema: GQLSchema;
  _ast: DocumentNode;
  _errors: Array<GQLError> = [];
  _parsedFilesMap: ParsedFilesMap = new Map();
  _plugins: Array<ISchemaPlugin> = [];

  _options: Options;
  _watcher: Watcher;

  providers = new Providers<ProviderParams>();

  constructor(options: Options) {
    super();
    this._options = options;
    this._registerProviders();
    this._createPlugins();
  }

  // commands
  findRefsOfTokenAtPosition(
    params: CommandParams,
  ): $ReadOnlyArray<GQLLocation> {
    return this._catchThrownErrors(() => {
      const result = [];
      if (this._match(params.source.name)) {
        const context = this._getContext(this.getSchema());
        const token = context
          .getParser()
          .getTokenAtPosition(params.source, params.position);

        if (token) {
          result.push(
            ...this.providers.provideRefs({
              token,
              context,
              source: params.source,
              position: params.position,
            }),
          );
        }
      }

      this._plugins.forEach(plugin => {
        result.push(...plugin.findRefsOfTokenAtPosition(params));
      });

      return result;
    }, []);
  }

  getDefinitionAtPosition(params: CommandParams): $ReadOnlyArray<GQLLocation> {
    return this._catchThrownErrors(() => {
      const result = [];
      if (this._match(params.source.name)) {
        const context = this._getContext(this.getSchema());
        const token = context
          .getParser()
          .getTokenAtPosition(params.source, params.position);

        if (token) {
          result.push(
            ...this.providers.provideDefinitions({
              token,
              context,
              source: params.source,
              position: params.position,
            }),
          );
        }
      }

      this._plugins.forEach(plugin => {
        result.push(...plugin.getDefinitionAtPosition(params));
      });

      return result;
    }, []);
  }

  getInfoOfTokenAtPosition(params: CommandParams): $ReadOnlyArray<GQLInfo> {
    return this._catchThrownErrors(() => {
      const result = [];
      if (this._match(params.source.name)) {
        const context = this._getContext(this.getSchema());
        const token = context
          .getParser()
          .getTokenAtPosition(params.source, params.position);

        if (token) {
          result.push(
            ...this.providers.provideInfo({
              token,
              context,
              source: params.source,
              position: params.position,
            }),
          );
        }
      }

      this._plugins.forEach(plugin => {
        result.push(...plugin.getInfoOfTokenAtPosition(params));
      });

      return result;
    }, []);
  }

  getHintsAtPosition(params: CommandParams): $ReadOnlyArray<GQLHint> {
    return this._catchThrownErrors(() => {
      const hints = [];
      if (this._match(params.source.name)) {
        const context = this._getContext(this.getSchema());
        const token = context
          .getParser()
          .getTokenAtPosition(params.source, params.position);

        if (token) {
          hints.push(
            ...this.providers.provideHints({
              token,
              context,
              source: params.source,
              position: params.position,
            }),
          );
        }
      }

      this._plugins.forEach(plugin => {
        hints.push(...plugin.getHintsAtPosition(params));
      });

      return hints;
    }, []);
  }

  // utils methods
  getSchema(): GQLSchema {
    return this._schema;
  }

  getGraphQLSchema(): GraphQLSchema {
    const schema = buildASTGraphQLSchema(
      this._ast,
      this._options.config.getGraphQLBuildSchemaOptions(),
    );
    assertValidSchema(schema);
    return schema;
  }

  getErrors(): $ReadOnlyArray<GQLError> {
    const errors = [];
    this._plugins.forEach(plugin => {
      errors.push(...plugin.getErrors());
    });
    errors.push(...this._errors);
    return errors;
  }

  onChangeSchema(listener: () => void): EmitterSubscription {
    return this._emitter.addListener('change_schema', listener);
  }

  async _handleStart() {
    const options = this._options;

    this._watcher = this._options.watcher.watch({
      rootPath: options.config.getDir(),
      files: options.config.getSchemaConfig().files,
      onChange: (files: Array<WatchFile>) => {
        // Handle Error
        try {
          this._updateFiles(files);
        } catch (e) {
          this._triggerError(e);
        }

        this._triggerChange();
      },
    });

    await this._watcher.onReady();
    await Promise.all(this._plugins.map(plugin => plugin.start()));
  }

  async _handleStop() {
    if (this._watcher) {
      await Promise.resolve(this._watcher.close());
    }
    await Promise.all(this._plugins.map(plugin => plugin.stop()));
  }

  // private methods
  _updateFiles(files: Array<WatchFile>) {
    const options = this._options;

    // console.time('updating files');
    files.forEach(({ name, exists }) => {
      // console.log(name, exists);
      const absPath = path.join(options.config.getDir(), name);
      if (exists) {
        this._parsedFilesMap.set(absPath, this._parseFile(absPath));
      } else {
        this._parsedFilesMap.delete(absPath);
      }
    });
    // console.timeEnd('updating files');

    //  build merged ast
    // console.time('buildAST');
    const { ast, errors: parseErrors } = this._buildASTFromParsedFiles(
      this._parsedFilesMap,
    );
    // console.timeEnd('buildAST');

    // build GQLSchema from ast
    // console.time('buildASTSchema');
    const { schema, errors: buildErrors } = buildASTSchema(
      ast,
      this._options.config.getGraphQLBuildSchemaOptions(),
    );
    this._ast = ast;
    this._schema =
      options.config.getSchemaConfig().extendSchema.length > 0
        ? this._presetExtendSchema(schema)
        : schema;

    const validationErrors = this.validateSchema(getValidationRules);

    this._errors = [...parseErrors, ...buildErrors, ...validationErrors];

    this._triggerChangeSchema();
  }

  validateSchema(getRules: $FixMe) {
    // @TODO which schema to use here (extended or not)?
    const context = this._getContext(this._schema);
    const rules = getRules({ context });
    // validate
    // console.time('validate');
    // console.log(config.validate);
    const validationErrors = validate(context, this._ast, rules);
    // console.timeEnd('validate');
    return validationErrors;
  }

  _parseFile = (absPath: string) => {
    const config = this._options.config.getSchemaConfig();
    const content = fs.readFileSync(absPath, 'utf8');
    const source = new Source(content, absPath);
    return parseSchemaFile(source, config);
  };

  _buildASTFromParsedFiles = (parsedFiles: ParsedFilesMap) => {
    const mergedDefinitions = [];
    const errors = [];
    // console.log(parsedFiles.size ==);
    if (parsedFiles.size === 0) {
      const schemaConfig = this._options.config.getSchemaConfig();
      errors.push(
        newGQLError(
          `No schema file found. Make sure schema file glob ${JSON.stringify(
            schemaConfig.files,
          )} matches atleast one file.`,
          undefined,
          SEVERITY.error,
        ),
      );
    } else {
      // for (const parsedFile of parsedFiles.values()) {
      this._parsedFilesMap.forEach(parsedFile => {
        if (parsedFile.isEmpty()) {
          return;
        }

        parsedFile.getDocuments().forEach(doc => {
          const parseError = doc.getParseError();
          if (parseError) {
            errors.push(parseError);
          } else {
            const definitions = doc.getDefinitions();
            mergedDefinitions.push(...definitions);
          }
        });
      });
    }

    return {
      errors, // parsed errors
      ast: {
        kind: 'Document',
        definitions: mergedDefinitions,
      },
    };
  };

  _presetExtendSchema = (schema: GQLSchema) => {
    return this._catchThrownErrors(() => {
      const { config } = this._options;
      return presetExtendSchema(
        schema,
        config.getSchemaConfig().extendSchema,
        config.getGraphQLParseOptions(),
        config.getGraphQLBuildSchemaOptions(),
      );
    }, schema);
  };

  _createPlugins = () => {
    this._getConfig().plugins.forEach(pluginModule => {
      const plugin = pluginModule.create({
        config: this._options.config,
        schemaService: this,
        watcher: this._options.watcher,
      });
      plugin.onError(this._triggerError);
      plugin.onChange(this._triggerChange);
      this._plugins.push(plugin);
    });
  };

  _match(filePath: string): boolean {
    const { config } = this._options;
    return config.match(filePath, config.getSchemaConfig().files);
  }

  _getContext = memoizeSingle((schema: GQLSchema): SchemaContext => {
    return new SchemaContext(schema, this._options.config.getSchemaConfig());
  });

  _getConfig() {
    return this._options.config.getSchemaConfig();
  }

  _registerProviders() {
    this.providers.registerDefinitionProvider(getDefinitionAtPosition);
    this.providers.registerInfoProvider(getInfoOfTokenAtPosition);
    this.providers.registerHintsProvider(getHintsAtPosition);
    this.providers.registerRefsProvider(findRefsOfTokenAtPosition);
  }

  _triggerChangeSchema() {
    this._emitter.emit('change_schema');
  }
}
