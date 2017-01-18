/* @flow */
/* eslint-disable no-loop-func */
import type { Position, Token, IParser } from './types';
import CharacterStream from 'codemirror-graphql/utils/CharacterStream';
import invariant from 'graphql/jsutils/invariant';
import printTokenState from './printTokenState';
import splitLines from './splitLines';
import whileSafe from './whileSafe';

export default function getTokenAtPosition(
  parser: IParser,
  sourceText: string,
  position: Position,
): Token {
  const state = parser.startState();
  const lines = splitLines(sourceText);
  const { line, column } = position;
  const lastLineIndex = Math.min(line, lines.length) - 1;

  let style;
  let stream;

  for (let index = 0; index <= lastLineIndex; index += 1) {
    stream = new CharacterStream(lines[index]);
    if (index < lastLineIndex) { // if not last line
      whileSafe({
        condition: () => !stream.eol(),
        call: () => {
          style = parser.token(stream, state);
          // console.log(
          //   `line: ${index} [${lines[index]}]`,
          //   `style: [${style}] token: [${stream.current()}] \n`,
          //   'state: ', state, '\n', printTokenState(state),
          // );
        },
        logOnInfiniteLoop: () => {
          console.log(
            `line: ${index} [${lines[index]}]`,
            `style: [${style}] token: [${stream.current()}] \n`,
            'state: ', state, '\n', printTokenState(state),
          );
        },
      });
    } else if (index === lastLineIndex) { // if last line run till column
      whileSafe({
        condition: () => stream.getCurrentPosition() < column && !stream.eol(),
        call: () => {
          style = parser.token(stream, state);
          // console.log(
          //   `line: ${index} [${lines[index]}]`,
          //   `style: [${style}] token: [${stream.current()}] \n`,
          //   'state: ', state, '\n', printTokenState(state),
          // );
        },
        logOnInfiniteLoop: () => {
          console.log(
            `line: ${index} [${lines[index]}]`,
            `style: [${style}] token: [${stream.current()}] \n`,
            'state: ', state, '\n', printTokenState(state),
          );
        },
      });
    }
  }

  invariant(style, 'expected style should have some value');
  invariant(stream, 'expected stream should have some value');

  const pos = Math.min(stream.getCurrentPosition(), column - 1);

  return {
    start: stream.getStartOfToken(),
    end: stream.getCurrentPosition(),
    string: stream.current(),
    prevChar: stream._sourceText.charAt(pos - 1),
    state,
    style,
  };
}
