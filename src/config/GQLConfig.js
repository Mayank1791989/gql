/* @flow */
/* eslint-disable no-use-before-define */
import findConfig from 'find-config';
import JSON5 from 'json5';
import fs from 'fs';
import minimatch from 'minimatch';
import parseGlob from 'parse-glob';
import path from 'path';
import _uniq from 'lodash/uniq';

type Options = {
  cwd?: string,
};

const CONFIG_FILE_NAME = '.gqlconfig';

export type QueryParser = (
  'QueryParser'
  | ['EmbeddedQueryParser', { startTag: string, endTag: string }]
);
export type Globs = string | Array<string>;
export type FileMatchConfig = Globs | { include: Globs, ignore?: Globs };
export type ValidateConfig = {
  extends: string,
  rules?: {
    [ruleName: string]: 'off' | 'warn' | 'error',
  },
};
export type QueryConfig = {
  match: FileMatchConfig,
  parser: QueryParser,
  isRelay?: boolean,
  validate?: ValidateConfig,
};

type GQLConfigFile = {
  schema: {
    files: FileMatchConfig,
    validate?: ValidateConfig,
  },
  query?: { // query optional
    files: Array<QueryConfig>,
  },
};

export type { Options as GQLConfigOptions };

class GQLConfig {
  _path: string;
  _configObj: GQLConfigFile;
  _dir: string;

  constructor(options: ?Options) {
    const result = findConfig.obj(CONFIG_FILE_NAME, options);
    if (!result) {
      // throw error .gqlConfig not found
      throw new Error(`Could not find a ${CONFIG_FILE_NAME} file. Create a ${CONFIG_FILE_NAME} file in project root directory.`);
    }

    this._dir = result.dir;
    this._path = result.path;
    this._configObj = this._readConfig(result.path);
  }

  getDir() {
    return this._dir;
  }

  getPath() {
    return this._path;
  }

  getFileExtensions(): Array<string> {
    const { schema, query } = this._configObj;
    const extensions = [];

    // schema
    extensions.push(...extractExtensions(schema.files));

    // query
    if (query) {
      query.files.forEach(({ match }) => {
        extensions.push(...extractExtensions(match));
      });
    }

    return _uniq(extensions);
  }

  getSchema() {
    return this._configObj.schema;
  }

  getQuery() {
    return this._configObj.query;
  }

  match(filePath: string): ?{ type: 'query' | 'schema', opts: Object } {
    const { schema, query } = this._configObj;
    const filePathRelative = path.relative(this.getDir(), filePath);

    // test schema
    if (matcher(filePathRelative, schema.files)) {
      return { type: 'schema', opts: {} };
    }

    // test query
    if (!query) { return null; }

    const { files } = query;
    const opts = files.find(({ match }) => matcher(filePathRelative, match));
    if (opts) {
      return { type: 'query', opts };
    }

    return null;
  }

  _readConfig(filePath: string) { // eslint-disable-line class-methods-use-this
    const fileData = fs.readFileSync(filePath, 'utf8');
    try {
      return (JSON5.parse(fileData): GQLConfigFile); // using flow-runtime it will be validated also
    } catch (err) {
      throw new Error(`\nError parsing ${CONFIG_FILE_NAME}. \n\n${err.message}`);
    }
  }
}

function extractExtensions(match: FileMatchConfig): Array<string> {
  if (typeof match === 'string') {
    return [getExtFromGlob(match)];
  }

  if (Array.isArray(match)) {
    return match.map(getExtFromGlob);
  }

  // object { match, exclude }
  return extractExtensions(match.include);
}

function getExtFromGlob(glob: string): string {
  return parseGlob(glob).path.ext; // without dot
}

function matchGlob(filePath, globs: Globs): boolean {
  if (typeof globs === 'string') {
    return minimatch(filePath, globs);
  }

  // matches any
  return Boolean(globs.find((glob) => minimatch(filePath, glob)));
}

function matcher(filePath, match: FileMatchConfig): boolean {
  if (typeof match === 'string' || Array.isArray(match)) {
    return matchGlob(filePath, match);
  }

  const _match = matchGlob(filePath, match.include);
  if (!_match) { return false; }

  const _matchesIgnore = match.ignore ? matchGlob(filePath, match.ignore) : false;

  return _match && !_matchesIgnore;
}

export default GQLConfig;
