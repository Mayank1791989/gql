/* @flow */
import path from 'path';
import fs from 'fs';

import { Source } from 'graphql/language/source';
import { parse } from 'graphql/language/parser';
import { GraphQLSchema } from 'graphql/type';

import { buildASTSchema } from './buildASTSchema';
import { buildASTSchema as buildASTGraphQLSchema } from 'graphql/utilities';

import { type GQLError, SEVERITY, toGQLError } from '../../shared/GQLError';

import { validate } from '../../schema';
import GQLConfig from '../../config/GQLConfig';

import watch from '../../shared/watch';

import { type ParsedFilesMap, type WatchFile } from '../../shared/types';

import { type GQLSchema } from '../../shared/GQLTypes';
import { type DocumentNode } from 'graphql/language/ast';

export default class GQLSchemaBuilder {
  _config: GQLConfig;
  _schema: GQLSchema;
  _ast: DocumentNode;
  _errors: Array<GQLError>;
  _parsedFilesMap: ParsedFilesMap = new Map();
  _isInitialized: boolean = false;

  constructor(options: {
    config: GQLConfig,
    onChange?: () => void,
    onInit?: Function,
    watch: boolean,
  }) {
    const { config, onChange, onInit } = options;

    this._config = config;

    // watch schema files and rebuild schema
    // console.log(config.getDir());
    const watchClient = watch({
      rootPath: config.getDir(),
      files: config.getSchema().files,
      name: 'gqlSchemaFiles',
      onChange: (files: Array<WatchFile>) => {
        this._updateFiles(files, config.getSchema());
        // console.log('init done');
        if (!this._isInitialized) {
          this._isInitialized = true;
          // console.log(this._isInitialized);
          if (onInit) {
            onInit();
          }
        }

        if (onChange) {
          onChange();
        }
        if (!options.watch) {
          watchClient.end();
        }
      },
    });
  }

  getSchema(): GQLSchema {
    return this._schema;
  }

  getGraphQLSchema(): GraphQLSchema {
    return buildASTGraphQLSchema(this._ast);
  }

  getSchemaErrors(): Array<GQLError> {
    return this._errors;
  }

  // private methods
  _updateFiles(files: Array<WatchFile>, config: any) {
    if (files.length === 0) {
      return;
    }

    // console.time('updating files');
    files.forEach(({ name, exists }) => {
      // console.log(name, exists);
      const absPath = path.join(this._config.getDir(), name);
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
    const { schema, errors: buildErrors } = buildASTSchema(ast);
    // console.timeEnd('buildASTSchema');

    // validate
    // console.time('validate');
    // console.log(config.validate);
    const validationErrors = validate(schema, ast, config.validate);
    // console.timeEnd('validate');

    this._ast = ast;
    this._schema = schema;
    this._errors = [...parseErrors, ...buildErrors, ...validationErrors];
  }

  _parseFile = (absPath: string) => {
    const content = fs.readFileSync(absPath, 'utf8');
    const source = new Source(content, absPath);
    try {
      const ast = parse(source);
      return {
        ast,
        error: null,
      };
    } catch (err) {
      return {
        error: toGQLError(err, SEVERITY.error),
        ast: null,
      };
    }
  };

  _buildASTFromParsedFiles = (parsedFiles: ParsedFilesMap) => {
    const mergedDefinitions = [];
    const errors = [];
    for (const parsedFile of parsedFiles.values()) {
      // eslint-disable-line no-restricted-syntax
      const { ast, error } = parsedFile;
      if (error) {
        errors.push(error);
      } else {
        const { definitions } = ast;
        mergedDefinitions.push(...definitions);
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
}
