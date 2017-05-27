/* @flow */
import {
  LINE_ENDING_REGEX,
  type LineEnding,
  validateLineEnding,
} from './constants';

type Line = {|
  +number: number, // starts from 1
  +text: string,
  +ending: LineEnding | '',
  +offset: number, // starts from 0
|};

export default function forEachLine(
  text: string,
  fn: (line: Line) => boolean,
): void {
  const lineEndingRegex = new RegExp(LINE_ENDING_REGEX, 'gu');
  let lineOffset = 0;
  let lineNumber = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const match = lineEndingRegex.exec(text);
    if (!match) {
      break;
    }
    const [lineEnding] = match;
    const lineEndingOffset = match.index;
    const lineText = text.substring(lineOffset, lineEndingOffset);
    const shouldBreak = fn({
      text: lineText,
      ending: validateLineEnding(lineEnding),
      number: lineNumber,
      offset: lineOffset,
    });
    if (shouldBreak) {
      break;
    }
    lineOffset = lineEndingOffset + lineEnding.length;
    lineNumber += 1;
  }
  // last line
  if (lineOffset < text.length || text === '') {
    fn({
      text: text.substring(lineOffset),
      offset: lineOffset,
      ending: '',
      number: lineNumber,
    });
  }
}
