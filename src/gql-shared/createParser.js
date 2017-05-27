/* @flow */
import { type IParser } from './types';

export default function createParser(
  params: [Class<IParser>, Object],
): IParser {
  const [Parser, options] = params;
  return new Parser(options);
}
