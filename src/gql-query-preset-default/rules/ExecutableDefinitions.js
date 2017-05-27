/* @flow */
import { GraphQLError } from 'graphql/error';

export function ExecutableDefinitions(context: any): any {
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
}
