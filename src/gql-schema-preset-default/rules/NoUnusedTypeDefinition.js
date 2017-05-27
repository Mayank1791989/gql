/* @flow */
import {
  GraphQLError,
  isObjectType,
  isNamedType,
  type NamedTypeNode,
} from 'graphql';
import { SchemaValidationContext } from 'gql-schema-service';

export function NoUnusedTypeDefinition(context: SchemaValidationContext) {
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
        const unusedTypes = Object.values(types).filter(type => {
          if (
            !isNamedType(type) ||
            (isObjectType(type) && type.getInterfaces().length > 0)
          ) {
            // ignore object types which implements interfaces
            // as it is possible there is no direct reference of type
            // but there is reference of interface it implements
            // (e.g interface Node and all types which implements Node)
            return false;
          }
          return !usedTypes[type.name];
        });

        unusedTypes.forEach(type => {
          if (isNamedType(type) && type.astNode) {
            context.reportError(
              new GraphQLError(`Unused type definition '${String(type)}'`, [
                type.astNode,
              ]),
            );
          }
        });
      },
    },

    NamedType(node: NamedTypeNode) {
      usedTypes[node.name.value] = true; // visited
    },
  };
}
