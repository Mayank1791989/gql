/* @flow */
import type { Position, GQLInfo } from '../../shared/types';
import type { GQLSchema } from '../../shared/GQLTypes';
import { getTokenAtPosition } from '../_shared/getTokenAtPosition';

function getInfoOfTokenAtPosition(
  schema: GQLSchema,
  sourceText: string,
  position: Position,
): ?GQLInfo {
  // console.log('getDef', sourceText, position);
  // console.time('getDef');
  // console.time('getTokenAtPosition');
  const token = getTokenAtPosition(sourceText, position);
  // console.timeEnd('getTokenAtPosition');
  // console.log('token', token);
  if (!token) { return null; }

  const { state } = token;
  if (
    state.kind === 'NamedType' ||
    (state.kind === 'UnionDef' && state.step === 4) || // union Type = Type1<-----
    (state.kind === 'UnionMember' && state.step === 1) || // union Type = Type1 | Type2<------
    (state.kind === 'Implements' && state.step === 1)
  ) {
    const name = state.name;
    const type = schema.getType(name);
    if (type) {
      return { contents: [type.print()] };
    }
  }
  return null;
}

export { getInfoOfTokenAtPosition };
