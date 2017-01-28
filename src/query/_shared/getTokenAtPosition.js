/* @flow */
import _getTokenAtPosition from '../../shared/getTokenAtPosition';
// import RelayQLParser from './shared/Parser';
import { type ParserConfig } from '../_shared/types';
import {
  type Position,
  type IParser,
} from '../../shared/types';

function newParser(parserConfig: ParserConfig): IParser {
  const _parserConfig = typeof parserConfig === 'string' ? [parserConfig] : parserConfig;
  const [name, opts] = _parserConfig;
  // $FlowDisableNextLine
  const Parser = require(`./Parsers/${name}`).default;
  return new Parser(opts);
}

export const getTokenAtPosition = (
  sourceText: string,
  position: Position,
  parserConfig: ParserConfig,
) => {
  const parser = newParser(parserConfig);
  const token = _getTokenAtPosition(parser, sourceText, position);
  return token;
};
export default getTokenAtPosition;
