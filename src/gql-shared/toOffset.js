/* @flow */
import { type GQLPosition } from './types';
import splitLines from './splitLines';

export default function toOffset(
  sourceText: string,
  position: GQLPosition,
): number {
  let offset = 0;
  splitLines(sourceText).find((line, index) => {
    if (position.line === index + 1) {
      offset += position.column;
      return true; // to break
    }
    offset += line.length + 1; // 1 for end of line
    return false;
  });
  return offset;
}
