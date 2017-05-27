/* @flow */
import { type IParser } from 'gql-shared/types';
import MultilineCharacterStream from 'gql-shared/MultilineCharacterStream';

export default function runParser({
  sourceText,
  parser,
}: {
  sourceText: string,
  parser: IParser,
}) {
  const state = parser.startState();
  const stream = new MultilineCharacterStream(sourceText);
  const result = [];
  while (!stream.eof()) {
    const style = parser.token(stream, state);
    result.push({
      start: stream.getStartOfToken(),
      end: stream.getCurrentPosition(),
      text: stream.current(),
      style,
    });
  }

  return result;
}
