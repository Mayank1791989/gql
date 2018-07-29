/* @flow */
export const LINE_ENDING_REGEX = '\r?\n';
export const LINE_ENDING = Object.freeze({
  crlf: '\r\n',
  lf: '\n',
});
export type LineEnding = $Values<typeof LINE_ENDING>;
