/* @flow */
import { GraphQLError } from 'graphql/error';

export function ExactlyOneOperation(context: any): any {
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
}
