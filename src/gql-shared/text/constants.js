/* @flow */
export const LINE_ENDING_REGEX = '\r?\n';
export const LINE_ENDING = Object.freeze({
  crlf: '\r\n',
  lf: '\n',
});
export type LineEnding = $Values<typeof LINE_ENDING>;

import invariant from 'invariant';
export function validateLineEnding(str: string): LineEnding {
  invariant(str === '\r\n' || str === '\n', 'invalid line ending');
  return str;
}
