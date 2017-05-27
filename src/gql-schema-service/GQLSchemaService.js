/* @flow */
import path from 'path';
import fs from 'fs';

import {
  parse,
  Source,
  GraphQLSchema,
  buildASTSchema as buildASTGraphQLSchema,
  type DocumentNode,
  assertValidSchema,
} from 'graphql';

import { type GQLError, SEVERITY, toGQLError } from 'gql-shared/GQLError';
import GQLWatcher from 'gql-watcher';
import GQLBaseService from 'gql-shared/GQLBaseService';
import {
  type GQLPosition,
  type GQLHint,
  type GQLInfo,
  type GQLLocation,
} from 'gql-shared/types';

import createParser from 'gql-shared/createParser';
import { buildASTSchema, GQLSchema } from 'gql-shared/GQLSchema';
import { newGQLError } from 'gql-shared/GQLError';
import presetExtendSchema from 'gql-shared/presetExtendSchema';

// commands
import findRefsOfTokenAtPosition from './commands/findRefsOfTokenAtPosition';
import getDefinitionAtPosition from './commands/getDefinitionAtPosition';
import getHintsAtPosition from './commands/getHintsAtPosition';
import getInfoOfTokenAtPosition from './commands/getInfoOfTokenAtPosition';

import schemaValidate from './shared/schemaValidate';
import SchemaContext from './shared/SchemaContext';

import GQLConfig from 'gql-config';
import { type SchemaConfigResolved } from 'gql-config/types';
import { type WatchFile } from 'gql-watcher';
import invariant from 'invariant';

type Options = {|
  config: GQLConfig,
  watcher: GQLWatcher,
|};

type CommandParams = {
  fileContent: string,
  fileOptions: SchemaConfigResolved,
  position: GQLPosition,
};

type ParsedSchemaFile = $ReadOnly<{
  error: GQLError | null,
  ast: DocumentNode | null,
  source: Source,
}>;

type ParsedFilesMap = Map<string, ParsedSchemaFile>;

export default class GQLSchemaService extends GQLBaseService {
  _schema: GQLSchema;
  _ast: DocumentNode;
  _errors: Array<GQLError> = [];
  _parsedFilesMap: Map<string, ParsedSchemaFile> = new Map();

  _options: Options;
  _watcher: *;

  constructor(options: Options) {
    super();
    this._options = options;
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
          this._emitter.emit('error', e);
        }

        this._emitter.emit('change');
      },
    });

    await this._watcher.onReady();
  }

  async _handleStop() {
    if (this._watcher) {
      await Promise.resolve(this._watcher.close());
    }
  }

  // commands
  findRefsOfTokenAtPosition(params: CommandParams): Array<GQLLocation> {
    return this._catchThrownErrors(() => {
      return findRefsOfTokenAtPosition({
        parser: createParser(params.fileOptions.parser),
        schema: this.getSchema(),
        sourceText: params.fileContent,
        position: params.position,
      });
    }, []);
  }

  getDefinitionAtPosition(params: CommandParams): ?GQLLocation {
    return this._catchThrownErrors(() => {
      return getDefinitionAtPosition({
        parser: createParser(params.fileOptions.parser),
        schema: this.getSchema(),
        sourceText: params.fileContent,
        position: params.position,
      });
    }, null);
  }

  getInfoOfTokenAtPosition(params: CommandParams): ?GQLInfo {
    return this._catchThrownErrors(() => {
      return getInfoOfTokenAtPosition({
        parser: createParser(params.fileOptions.parser),
        schema: this.getSchema(),
        sourceText: params.fileContent,
        position: params.position,
      });
    }, null);
  }

  getHintsAtPosition(params: CommandParams): Array<GQLHint> {
    return this._catchThrownErrors(() => {
      return getHintsAtPosition({
        parser: createParser(params.fileOptions.parser),
        schema: this.getSchema(),
        sourceText: params.fileContent,
        position: params.position,
      });
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

  getSchemaErrors(): Array<GQLError> {
    return this._errors;
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
    // console.timeEnd('buildASTSchema');

    const context = new SchemaContext(schema, options.config.getSchemaConfig());
    // validate
    // console.time('validate');
    // console.log(config.validate);
    const validationErrors = schemaValidate(context, ast);
    // console.timeEnd('validate');

    this._ast = ast;

    this._schema =
      options.config.getSchemaConfig().extendSchema.length > 0
        ? this._presetExtendSchema(schema)
        : schema;

    this._errors = [...parseErrors, ...buildErrors, ...validationErrors];
  }

  _parseFile = (absPath: string) => {
    const content = fs.readFileSync(absPath, 'utf8');
    const source = new Source(content, absPath);
    try {
      const ast = parse(source, this._options.config.getGraphQLParseOptions());
      return {
        ast,
        error: null,
        source,
      };
    } catch (err) {
      return {
        error: toGQLError(err, SEVERITY.error),
        ast: null,
        source,
      };
    }
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
          null,
          SEVERITY.error,
        ),
      );
    } else {
      for (const parsedFile of parsedFiles.values()) {
        // eslint-disable-line no-restricted-syntax
        const { ast, error } = parsedFile;
        if (error) {
          errors.push(error);
        } else {
          invariant(ast, 'Expecting ast missing');
          const { definitions } = ast;
          mergedDefinitions.push(...definitions);
        }
      }
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
}
