/* @flow */
import { type GQLLocation } from 'gql-shared/types';
import { isPlaceholderType } from 'gql-shared/GQLSchema';
import getDefLocationForNode from 'gql-shared/getDefLocationForNode';
import { type ProviderParams } from './types';

export default function getDefinitionAtPosition(
  params: ProviderParams,
): $ReadOnlyArray<GQLLocation> {
  const { context, token } = params;
  const { state } = token;

  if (
    state.kind === 'NamedType' ||
    (state.kind === 'UnionDef' && state.step === 4) || // union Type = Type1<-----
    (state.kind === 'UnionMember' && state.step === 1) || // union Type = Type1 | Type2<------
    (state.kind === 'Implements' && state.step === 1)
  ) {
    const { name } = state;
    if (name) {
      const type = context.getType(name);
      if (type && !isPlaceholderType(type)) {
        return [getDefLocationForNode(type.astNode)].filter(Boolean);
      }
    }
  }

  return [];
}
