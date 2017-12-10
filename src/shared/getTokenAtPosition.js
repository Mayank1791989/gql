/* @flow */
/* eslint-disable no-loop-func */
import {
  type Position,
  type Token,
  type IParser,
} from './types';
import invariant from 'graphql/jsutils/invariant';
import whileSafe from './whileSafe';

import printTokenState from './printTokenState';

import MultilineCharacterStream from './MultilineCharacterStream';
import toOffset from './toOffset';

export default function getTokenAtPosition(
  parser: IParser,
  _sourceText: string,
  position: Position,
): Token {
  const sourceText = _sourceText ? _sourceText : ' ';
  const state = parser.startState();
  const offset = toOffset(sourceText, position);
  const stream = new MultilineCharacterStream(sourceText);

  let style = '';

  if (offset === 0) {
    // for first character
    style = parser.token(stream, state);
  } else {
    whileSafe({
      condition: () => stream.getCurrentPosition() < offset,
      call: () => {
        style = parser.token(stream, state);
        // if (style === 'js-frag') {
          // console.log(
          //   `position: ${stream.getCurrentPosition()}`,
          //   `start: ${stream.getStartOfToken()}`,
          //   `style: [${style}] token: [${stream.current()}] \n`,
          //   // 'state: ', state, '\n', printTokenState(state),
          // );
        // }
      },
      logOnInfiniteLoop: () => {
        console.log(
          `style: [${style}] token: [${stream.current()}] \n`,
          'state: ', state, '\n', printTokenState(state),
        );
      },
    }, sourceText.length);
  }

  invariant(style, 'expected style should have some value');
  invariant(stream, 'expected stream should have some value');

  const pos = Math.min(stream.getCurrentPosition(), offset - 1);

  return {
    start: stream.getStartOfToken(),
    end: stream.getCurrentPosition(),
    string: stream.current(),
    prevChar: stream._sourceText.charAt(pos - 1),
    state,
    style,
  };
}
