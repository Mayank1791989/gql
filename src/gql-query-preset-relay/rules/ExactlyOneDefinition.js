/* @flow */
import { GraphQLError, type ASTVisitor } from 'graphql';
import { type QueryValidationRule } from 'gql-query-service';

export function ExactlyOneDefinition(): QueryValidationRule {
  return {
    create(context): ASTVisitor {
      return {
        Document: {
          enter(node) {
            if (node.definitions.length !== 1) {
              context.reportError(
                new GraphQLError('Expected exactly one definition.', [
                  ...node.definitions,
                ]),
              );
            }
          },
        },
      };
    },
  };
}
