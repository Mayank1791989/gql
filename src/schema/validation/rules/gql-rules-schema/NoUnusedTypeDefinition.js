/* @flow */
import { GraphQLError } from 'graphql/error';
import { GQLObjectType } from '../../../../shared/GQLTypes';

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
        const unusedTypes = Object.keys(types).filter((typeName) => {
          const type = types[typeName];
          if (type instanceof GQLObjectType && type.getInterfaces().length > 0) {
            // ignore object types which implements interfaces
            // as it is possible there is no direct reference of type
            // but there is reference of interface it implements
            // (e.g interface Node and all types which implements Node)
            return false;
          }
          return !usedTypes[typeName];
        });
        unusedTypes.forEach((typeName) => {
          context.reportError(
            new GraphQLError(
              `Unused type definition '${typeName}'`,
              [schema.getTypeNode(typeName)],
            ),
          );
        });
      },
    },

    NamedType(node: Object) {
      usedTypes[node.name.value] = true; // visited
    },
  };
}
