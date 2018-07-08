/* @flow */
import { GraphQLError } from 'graphql/error';
import { type ASTNode } from 'graphql';
import toGQLError, { type GQLErrorSeverity } from './toGQLError';

export default function newGQLError(
  message: string,
  nodes: ?$ReadOnlyArray<ASTNode>,
  severity: GQLErrorSeverity,
) {
  const error = new GraphQLError(message, nodes);
  return toGQLError(error, severity);
}
