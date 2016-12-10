/* @flow */
import { GraphQLError } from 'graphql/error';
import { SEVERITY } from '../../constants';

export function NoUnusedTypeDefinition(context: any) {
  let usedTypes = {};

  return {
    Document: {
      enter() {
        usedTypes = {
          Mutation: true,
          Query: true,
          String: true,
          Int: true,
          Float: true,
          ID: true,
          Boolean: true,
        };
      },

      leave() {
        const schema = context.getSchema();
        const types = schema.getTypeMap();
        const unusedTypes = Object.keys(types).filter(typeName => (!usedTypes[typeName]));
        unusedTypes.forEach((typeName) => {
          context.reportError(
            new GraphQLError(
              `Unused type definition '${typeName}'`,
              [schema.getTypeNode(typeName)],
            ),
            SEVERITY.warn,
          );
        });
      },
    },

    NamedType(node: Object) {
      usedTypes[node.name.value] = true; // visited
    },
  };
}
