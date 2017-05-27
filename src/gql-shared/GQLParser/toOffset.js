/* @flow */
import { type GQLPosition } from '../types';
import { forEachLine } from 'gql-shared/text';

export default function toOffset(
  sourceText: string,
  position: GQLPosition,
): number {
  let offset = 0;
  forEachLine(sourceText, line => {
    if (position.line === line.number) {
      offset = line.offset + position.column;
      return true; // to break
    }
    return false;
  });
  return offset;
}
