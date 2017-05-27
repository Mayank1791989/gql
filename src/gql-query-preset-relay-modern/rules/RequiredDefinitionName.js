/* @flow */
import { GraphQLError, type ASTVisitor, ValidationContext } from 'graphql';
import { type QueryValidationRule } from 'gql-query-service';

export function RequiredDefinitionName(): QueryValidationRule {
  return {
    create(context: ValidationContext): ASTVisitor {
      return {
        Document: {
          enter(node) {
            node.definitions.forEach(definition => {
              if (!definition.name) {
                context.reportError(
                  new GraphQLError('name is missing.', [definition]),
                );
              }
            });
          },
        },
      };
    },
  };
}
