/* @flow */
import { GraphQLError } from 'graphql';
import { type QueryValidationRule } from 'gql-query-service';

export function missingOperationName(operation: string): string {
  return `${operation} name is missing.`;
}

/**
 * In graphql operation name is optional but this rule enforce name is provided
 * name will be useful to debug graphql network request
 */
export function RequiredOperationName(): QueryValidationRule {
  return {
    create(context) {
      return {
        OperationDefinition(node) {
          const { name } = node;
          if (!name) {
            context.reportError(
              new GraphQLError(missingOperationName(node.operation), [node]),
            );
          }
        },
      };
    },
  };
}
