/* @flow */
import type { Position, DefLocation } from '../../shared/types';
import type { GQLSchema } from '../../shared/GQLTypes';
import { getTokenAtPosition } from '../_shared/getTokenAtPosition';
import getDefLocationForNode from '../../shared/getDefLocationForNode';

function getDefinitionAtPosition(
  schema: GQLSchema,
  sourceText: string,
  position: Position,
): ?DefLocation {
  // console.log('getDef', sourceText, position);
  // console.time('getDef');
  // console.time('getTokenAtPosition');
  const token = getTokenAtPosition(sourceText, position);
  // console.timeEnd('getTokenAtPosition');
  // console.log('token', token);
  if (!token) { return null; }

  const { state } = token;

  // console.log(state.kind, state.step);

  if (
    state.kind === 'NamedType' ||
    (state.kind === 'UnionDef' && state.step === 4) || // union Type = Type1<-----
    (state.kind === 'UnionMember' && state.step === 1) || // union Type = Type1 | Type2<------
    (state.kind === 'Implements' && state.step === 1)
  ) {
    const name = state.name;
    const type = schema.getType(name);
    if (type) {
      return getDefLocationForNode(type.node);
    }
  }
  return null;
}

export { getDefinitionAtPosition };
