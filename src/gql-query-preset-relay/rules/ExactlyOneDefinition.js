/* @flow */
import { GraphQLError } from 'graphql/error';

export function ExactlyOneDefinition(context: any): any {
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
}
