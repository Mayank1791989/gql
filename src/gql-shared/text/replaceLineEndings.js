/* @flow */
import { type LineEnding, LINE_ENDING_REGEX } from './constants';

export default function replaceLineEndings(
  text: string,
  newLineEnding: LineEnding,
): string {
  return text.replace(new RegExp(LINE_ENDING_REGEX, 'g'), newLineEnding);
}
