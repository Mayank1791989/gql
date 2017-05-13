/* @flow */
import { getTokenAtPosition } from '../_shared/getTokenAtPosition';
import { type Position, type DefLocation } from '../../shared/types';
import { type GQLSchema } from '../../shared/GQLTypes';
import getDefLocationForNode from '../../shared/getDefLocationForNode';

// import printTokenState from '../../shared/printTokenState';

function findRefsOfTokenAtPosition(
  schema: GQLSchema,
  sourceText: string,
  position: Position,
): Array<DefLocation> {
  // console.log('getDef', sourceText, position);
  // console.time('getDef');
  // console.time('getTokenAtPosition');
  const token = getTokenAtPosition(sourceText, position);
  // console.timeEnd('getTokenAtPosition');
  // console.log('token', token);
  if (!token) {
    return [];
  }

  const { state } = token;

  if (
    state.kind.endsWith('Def') ||
    state.kind === 'NamedType' ||
    (state.kind === 'UnionMember' && state.step === 1) || // union Type = Type1 | Type2<------
    (state.kind === 'Implements' && state.step === 1)
  ) {
    const { name } = state;
    const type = schema.getType(name);
    if (type) {
      const locations = type.dependents
        .concat(type.node && type.node.name) // include definition also
        .map(getDefLocationForNode)
        .filter((defLocation) => Boolean(defLocation));
      // 'any' Flow not able to detect we are filtering nul values
      return (locations: any);
    }
  }
  return [];
}

export { findRefsOfTokenAtPosition };
export default findRefsOfTokenAtPosition;
