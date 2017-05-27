/* @flow */
import { type CommandParams } from './types';
import { type GQLLocation } from 'gql-shared/types';
import getTokenAtPosition from 'gql-shared/getTokenAtPosition';

export default function findRefsOfTokenAtPosition({
  context,
  source,
  position,
}: CommandParams): Array<GQLLocation> {
  const token = getTokenAtPosition(context.getParser(), source.body, position);
  // console.log('token', token);
  // TODO: implement findRefs for fragment

  if (!token) {
    return [];
  }

  return [];
}
