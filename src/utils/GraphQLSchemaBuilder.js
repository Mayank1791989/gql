/* @flow */
import path from 'path';
import fs from 'fs';

import GraphQLSchema from './GraphQLSchema';
import { buildASTSchema } from './buildASTSchema';
import { toGQLError } from './GQLError';

import { SEVERITY } from '../constants';

import { Source } from 'graphql/language/source';
import { parse } from 'graphql/language/parser';

import type {
  ParsedFilesMap,
  GQLConfig,
  WatchFile,
  DocumentNode,
  GQLError,
} from './types';

export default class GraphQLSchemaBuilder {
  _config: GQLConfig;
  _schema: GraphQLSchema;
  _ast: DocumentNode;
  _errors: Array<GQLError>;
  _parsedFilesMap: ParsedFilesMap = new Map();

  constructor(config: GQLConfig) {
    this._config = config;
  }

  updateFiles(files: Array<WatchFile>) {
    if (files.length === 0) { return; }

    // console.time('updating files');
    files.forEach(({ name, exists }) => {
      // console.log(name, exists);
      const absPath = path.join(this._config.dir, name);
      if (!exists) {
        this._parsedFilesMap.delete(absPath);
      } else {
        this._parsedFilesMap.set(absPath, this._parseFile(absPath));
      }
    });
    // console.timeEnd('updating files');

    //  build merged ast
    // console.time('buildAST')
    const { ast, errors: parseErrors } = this._buildASTFromParsedFiles(this._parsedFilesMap);
    // console.timeEnd('buildAST')

    // build GraphQLSchema from ast
    // console.time('buildASTSchema');
    const { schema, errors: buildErrors } = buildASTSchema(ast);
    // console.timeEnd('buildASTSchema');

    // validate
    // console.time('validate');
    // this._errors = validate(this._schema, this._ast);
    // console.timeEnd('validate');
    this._ast = ast;
    this._schema = schema;
    this._errors = [
      ...parseErrors,
      ...buildErrors,
      // ...validationErrors,
    ];
  }

  getSchema(): GraphQLSchema {
    return this._schema;
  }

  getSchemaErrors(): Array<GQLError> {
    return this._errors;
  }

  // private methods
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
    for (const parsedFile of parsedFiles.values()) { // eslint-disable-line no-restricted-syntax
      const { ast, error } = parsedFile;
      if (!error) {
        const definitions = ast.definitions;
        mergedDefinitions.push(...definitions);
      } else {
        errors.push(error);
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
