/* @flow */
import { type GQLPosition, type GQLInfo, type IParser } from 'gql-shared/types';
import { GQLSchema, isPlaceholderType } from 'gql-shared/GQLSchema';
import getTokenAtPosition from 'gql-shared/getTokenAtPosition';

export default function getInfoOfTokenAtPosition({
  schema,
  sourceText,
  position,
  parser,
}: {
  schema: GQLSchema,
  sourceText: string,
  position: GQLPosition,
  parser: IParser,
}): ?GQLInfo {
  // console.log('getDef', sourceText, position);
  // console.time('getDef');
  // console.time('getTokenAtPosition');
  const token = getTokenAtPosition(parser, sourceText, position);
  // console.timeEnd('getTokenAtPosition');
  // console.log('token', token);
  if (!token) {
    return null;
  }

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
      const type = schema.getType(name);
      if (type && !isPlaceholderType(type)) {
        return { contents: [schema.printer.printType(type)] };
      }
    }
  }
  return null;
}
