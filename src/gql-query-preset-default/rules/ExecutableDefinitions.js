/* @flow */
import { GraphQLError } from 'graphql';
import { type QueryValidationRule } from 'gql-query-service';

export function ExecutableDefinitions(): QueryValidationRule {
  return {
    create(context) {
      return {
        Document: {
          enter(node) {
            node.definitions.forEach(definition => {
              if (
                definition.kind !== 'OperationDefinition' &&
                definition.kind !== 'FragmentDefinition'
              ) {
                context.reportError(
                  new GraphQLError(
                    'Definition is not executable (Only fragment, mutation, query or subscription is allowed).',
                    [definition],
                  ),
                );
              }
            });
          },
        },
      };
    },
  };
}
