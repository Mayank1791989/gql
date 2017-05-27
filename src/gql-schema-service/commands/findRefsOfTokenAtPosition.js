/* @flow */
import {
  type GQLPosition,
  type GQLLocation,
  type IParser,
} from 'gql-shared/types';
import { GQLSchema } from 'gql-shared/GQLSchema';
import getTokenAtPosition from 'gql-shared/getTokenAtPosition';
import getDefLocationForNode from 'gql-shared/getDefLocationForNode';

// import printTokenState from 'gql-shared/printTokenState';

export default function findRefsOfTokenAtPosition({
  schema,
  sourceText,
  position,
  parser,
}: {
  schema: GQLSchema,
  sourceText: string,
  position: GQLPosition,
  parser: IParser,
}): Array<GQLLocation> {
  // console.log('getDef', sourceText, position);
  // console.time('getDef');
  // console.time('getTokenAtPosition');
  const token = getTokenAtPosition(parser, sourceText, position);
  // console.timeEnd('getTokenAtPosition');
  // console.log('token', token);
  if (!token) {
    return [];
  }

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
      const typeDependents = schema.getTypeDependents(name);
      const locations = typeDependents
        .map(getDefLocationForNode)
        .filter(defLocation => Boolean(defLocation));
      // 'any' Flow not able to detect we are filtering nul values
      return (locations: any);
    }
  }
  return [];
}
