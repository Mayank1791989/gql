/* @flow */
import path from 'path';
import fs from 'fs';

import { Source } from 'graphql/language/source';

import { type GQLError, SEVERITY, toGQLError } from '../shared/GQLError';

import validate from './validation/validate';
import parseQuery from './_shared/parseQuery';
import GQLConfig from '../config/GQLConfig';

import watch from '../shared/watch';

import { type ParsedFilesMap, type WatchFile } from '../shared/types';

import { type GQLSchema } from '../shared/GQLTypes';

type Options = {
  config: GQLConfig,
  getSchema: () => GQLSchema,
  onChange?: () => void,
  onInit?: () => void,
};

export class QueryManager {
  _config: GQLConfig;
  _errors: Array<GQLError> = [];
  _parsedFilesMap: ParsedFilesMap = new Map();
  _getSchema: () => GQLSchema;
  _initialized: boolean = false;

  constructor(options: Options) {
    const { config, onChange, onInit } = options;

    this._config = config;
    this._getSchema = options.getSchema;

    // watch schema files and rebuild schema
    const queryConfig = config.getQuery();

    if (!queryConfig) {
      return;
    }

    queryConfig.files.map((fileConfig, index) =>
      watch({
        rootPath: config.getDir(),
        files: fileConfig.match,
        name: `gqlQueryFiles-${index}`,
        onChange: (files: Array<WatchFile>) => {
          this._updateFiles(files, fileConfig);
          // console.log('init done');
          if (!this._initialized) {
            this._initialized = true;
            if (onInit) {
              onInit();
            }
          }
          if (onChange) {
            onChange();
          }
        },
      }),
    );
  }

  getErrors(): Array<GQLError> {
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
        // console.time('parseFile');
        this._parsedFilesMap.set(absPath, this._parseFile(absPath, config));
        // console.timeEnd('parseFile');
      } else {
        this._parsedFilesMap.delete(absPath);
      }
    });
    // console.timeEnd('updating files');

    this._errors = this._findErrors();
  }

  _findErrors = () => {
    const schema = this._getSchema();
    const errors = [];
    this._parsedFilesMap.forEach((parsedFile) => {
      if (parsedFile.isEmpty) {
        return;
      }

      if (parsedFile.error) {
        errors.push(parsedFile.error);
      } else {
        const validationErrors = validate(
          schema,
          parsedFile.ast,
          parsedFile.config,
        );
        if (validationErrors) {
          errors.push(...validationErrors);
        }
      }
    });
    return errors;
  };

  _parseFile = (absPath: string, config: any) => {
    const content = fs.readFileSync(absPath, 'utf8');
    const source = new Source(content, absPath);
    try {
      const { ast, isEmpty } = parseQuery(source, config);
      return {
        ast,
        error: null,
        isEmpty,
        config,
      };
    } catch (err) {
      return {
        error: toGQLError(err, SEVERITY.error),
        ast: null,
        config,
      };
    }
  };
}
