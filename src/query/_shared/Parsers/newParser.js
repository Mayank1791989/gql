/* @flow */
import type { QueryParser } from '../../../config/GQLConfig';
import type { IParser } from '../../../shared/types';

export default function newParser(parser: QueryParser): IParser {
  const _parserConfig = typeof parser === 'string' ? [parser] : parser;
  const [name, opts] = _parserConfig;
  // $FlowDisableNextLine
  const Parser = require(`./${name}`).default;
  return new Parser(opts);
}
