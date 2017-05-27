/* @flow */
import MultilineCharacterStream from './MultilineCharacterStream';
import whileSafe from './whileSafe';
import printTokenState from './printTokenState';
import { type IParser, type TokenState } from './types';

export const BREAK = 'BREAK';

export default function runParser(
  parser: IParser,
  _sourceText: string,
  callback: (
    stream: MultilineCharacterStream,
    state: TokenState,
    style: string,
  ) => null | typeof BREAK,
) {
  const sourceText = _sourceText ? _sourceText : ' ';
  const state = parser.startState();
  const stream = new MultilineCharacterStream(sourceText);

  let style = '';

  let breakByCallback = false;
  whileSafe(
    {
      condition: () => !stream.eof() && !breakByCallback,
      call: () => {
        style = parser.token(stream, state);
        // eslint-disable-next-line callback-return
        const code = callback(stream, state, style);
        if (code === BREAK) {
          breakByCallback = true;
        }
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
          'state: ',
          state,
          '\n',
          printTokenState(state),
        );
      },
    },
    sourceText.length,
  );
}
