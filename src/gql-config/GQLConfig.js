/* @flow */
import findConfigFile from './findConfigFile';
import readConfigFile from './readConfigFile';
import resolveConfigFile from './resolveConfigFile';
import extractExtensions from './extractExtensions';
import getConfigForFile, {
  type SchemaFileConfig,
  type QueryFileConfig,
} from './getConfigForFile';

import _memoize from 'lodash/memoize';

import { type GQLConfigFileResolved } from './types';
import {
  type ParseOptions as GraphQLParseOptions,
  type BuildSchemaOptions as GraphQLBuildSchemaOptions,
} from 'graphql';

class GQLConfig {
  _dir: string;
  _path: string;
  _configFileResolved: GQLConfigFileResolved;

  constructor(options: { configDir: string }) {
    const result = findConfigFile(options.configDir);
    this._dir = result.dir;
    this._path = result.path;
    this._configFileResolved = resolveConfigFile(
      readConfigFile(result.path),
      result.dir,
    );
    // console.log(JSON.stringify(this._configFileResolved, null, 2));
  }

  // return directory containing config file
  getDir(): string {
    return this._dir;
  }

  // return path of config file
  getPath(): string {
    return this._path;
  }

  // return all file extensions in config file
  getFileExtensions: () => Array<string> = _memoize(() =>
    extractExtensions(this._configFileResolved),
  );

  // return schema config
  getSchemaConfig(): $PropertyType<GQLConfigFileResolved, 'schema'> {
    return this._configFileResolved.schema;
  }

  // return query config
  getQueryConfig(): $PropertyType<GQLConfigFileResolved, 'query'> {
    return this._configFileResolved.query;
  }

  // returns config for given file path
  // file can be schema file or any query file
  getFileConfig(filePath: string): SchemaFileConfig | QueryFileConfig | null {
    return getConfigForFile(filePath, this._configFileResolved, this.getDir());
  }

  getGraphQLParseOptions(): GraphQLParseOptions {
    const { graphQLOptions } = this.getSchemaConfig();
    const options = {};

    if (
      graphQLOptions &&
      typeof graphQLOptions.allowLegacySDLEmptyFields === 'boolean'
    ) {
      options.allowLegacySDLEmptyFields =
        graphQLOptions.allowLegacySDLEmptyFields;
    }

    if (
      graphQLOptions &&
      typeof graphQLOptions.allowLegacySDLImplementsInterface === 'boolean'
    ) {
      options.allowLegacySDLImplementsInterfaces =
        graphQLOptions.allowLegacySDLImplementsInterface;
    }

    return options;
  }

  getGraphQLBuildSchemaOptions(): GraphQLBuildSchemaOptions {
    const { graphQLOptions } = this.getSchemaConfig();
    const options = {};
    if (
      graphQLOptions &&
      typeof graphQLOptions.commentDescriptions === 'boolean'
    ) {
      options.commentDescriptions = graphQLOptions.commentDescriptions;
    }
    return options;
  }
}

export default GQLConfig;
