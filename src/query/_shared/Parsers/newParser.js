/* @flow */
import { type QueryParser } from '../../../config/GQLConfig';
import { type IParser } from '../../../shared/types';

// Parsers
const availableParsers = {
  EmbeddedQueryParser: require('./EmbeddedQueryParser').default,
  QueryParser: require('./QueryParser').default,
};

export default function newParser(parser: QueryParser): IParser {
  const _parserConfig = typeof parser === 'string' ? [parser] : parser;
  const [name, opts] = _parserConfig;
  const Parser = availableParsers[name];
  return new Parser(opts);
}
