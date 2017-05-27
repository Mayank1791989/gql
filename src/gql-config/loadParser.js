/* @flow */
import path from 'path';
import importModule from 'gql-shared/importModule';
import { type IParser } from 'gql-shared/types';
import { type ParserPkg } from './types';
import { normalizePkgConfig } from './normalizePkg';

type Options = Object;
const GQL_MODULE_DIR = path.resolve(__dirname, '../');

export function loadQueryParser(
  parser: ?ParserPkg,
  configPath: string,
): [Class<IParser>, Options] {
  return loadParser({
    parser: parser || 'default',
    prefix: 'gql-query-parser',
    coreParsers: [
      'gql-query-parser-default',
      'gql-query-parser-embedded-queries',
    ],
    configPath,
  });
}

export function loadSchemaParser(
  parser: ?ParserPkg,
  configPath: string,
): [Class<IParser>, Options] {
  return loadParser({
    parser: parser || 'default',
    prefix: 'gql-schema-parser',
    coreParsers: ['gql-schema-parser-default'],
    configPath,
  });
}

function loadParser(params: {
  parser: ParserPkg,
  prefix: string,
  configPath: string,
  coreParsers: Array<string>,
}) {
  const [parserPkg, options] = normalizePkgConfig(params.prefix, params.parser);

  const [pkg, dir] = params.coreParsers.includes(parserPkg)
    ? [`./${parserPkg}`, GQL_MODULE_DIR]
    : [parserPkg, params.configPath];

  try {
    return [importModule(pkg, dir), options];
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        `PARSER_PKG_NOT_FOUND: Parser '${pkg}' not found relative to '${dir}'`,
      );
    }
    throw err;
  }
}
