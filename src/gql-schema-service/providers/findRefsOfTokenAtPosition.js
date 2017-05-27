/* @flow */
import { type GQLLocation } from 'gql-shared/types';
import getDefLocationForNode from 'gql-shared/getDefLocationForNode';
import { type ProviderParams } from './types';

export default function findRefsOfTokenAtPosition(
  params: ProviderParams,
): Array<GQLLocation> {
  const { context, token } = params;
  const { state } = token;

  if (
    state.kind &&
    (state.kind.endsWith('Def') ||
    state.kind === 'NamedType' ||
    (state.kind === 'UnionMember' && state.step === 1) || // union Type = Type1 | Type2<------
      (state.kind === 'Implements' && state.step === 1))
  ) {
    const { name } = state;
    if (name) {
      const typeDependents = context.getTypeDependents(name);
      return typeDependents.map(getDefLocationForNode).filter(Boolean);
    }
  }
  return [];
}
