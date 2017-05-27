/* @flow */
import { type GQLInfo } from 'gql-shared/types';
import { isPlaceholderType } from 'gql-shared/GQLSchema';
import { type ProviderParams } from './types';

export default function getInfoOfTokenAtPosition(
  params: ProviderParams,
): $ReadOnlyArray<GQLInfo> {
  const { token, context } = params;
  const { state } = token;
  // console.log(state, token);
  // console.log(state.kind, state.step);
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
        return [{ contents: [context.getPrinter().printType(type)] }];
      }
    }
  }
  return [];
}
