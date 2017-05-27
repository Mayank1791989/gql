/* @flow */
import path from 'path';
import minimatch from 'minimatch';
import {
  type GQLConfigFileResolved,
  type FileMatchConfig,
  type Globs,
  type SchemaConfigResolved,
  type QueryConfigResolved,
} from './types';

export type SchemaFileConfig = {
  type: 'schema',
  opts: SchemaConfigResolved,
};

export type QueryFileConfig = {
  type: 'query',
  opts: QueryConfigResolved,
};

export default function getConfigForFile(
  filePath: string,
  configFile: GQLConfigFileResolved,
  configFileDir: string,
): SchemaFileConfig | QueryFileConfig | null {
  const filePathRelative = path.relative(configFileDir, filePath);

  // test schema
  if (matcher(filePathRelative, configFile.schema.files)) {
    return { type: 'schema', opts: configFile.schema };
  }

  // test query
  if (!configFile.query) {
    return null;
  }

  const { files } = configFile.query;
  const opts = files.find(({ match }) => matcher(filePathRelative, match));
  if (opts) {
    return { type: 'query', opts };
  }

  return null;
}

function matchGlob(filePath, globs: Globs): boolean {
  // console.log(filePath, globs);
  if (typeof globs === 'string') {
    return minimatch(filePath, globs);
  }

  // matches any
  return Boolean(globs.find(glob => minimatch(filePath, glob)));
}

function matcher(filePath, match: FileMatchConfig): boolean {
  if (typeof match === 'string' || Array.isArray(match)) {
    return matchGlob(filePath, match);
  }

  const _match = matchGlob(filePath, match.include);
  if (!_match) {
    return false;
  }

  const _matchesIgnore = match.ignore
    ? matchGlob(filePath, match.ignore)
    : false;

  return _match && !_matchesIgnore;
}
