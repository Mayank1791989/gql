/* @flow */
import { GraphQLError } from 'graphql/error';
import toGQLError, { type GQLErrorSeverity } from './toGQLError';

export default function newGQLError(
  message: string,
  nodes: ?Array<*>,
  severity: GQLErrorSeverity,
) {
  const error = new GraphQLError(message, nodes);
  return toGQLError(error, severity);
}
