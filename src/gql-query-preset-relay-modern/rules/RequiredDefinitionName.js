/* @flow */
import { GraphQLError } from 'graphql/error';

export function RequiredDefinitionName(context: any): any {
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
}
