/* @flow */
import { GraphQLError, ValidationContext, type ASTVisitor } from 'graphql';
import { type QueryValidationRule } from 'gql-query-service';

export function ExactlyOneOperation(): QueryValidationRule {
  return {
    create(context: ValidationContext): ASTVisitor {
      return {
        Document: {
          enter(node) {
            // TODO: first check the tag should be graphql tag (graphql or graphql.experimental)
            const [mainDefinition, ...otherDefinitions] = node.definitions;
            if (mainDefinition.kind === 'OperationDefinition') {
              if (otherDefinitions.length > 0) {
                context.reportError(
                  new GraphQLError(
                    'Expected exactly one operation (query, mutation or subscription)',
                    [...otherDefinitions],
                  ),
                );
              }
            }
          },
        },
      };
    },
  };
}
