/* @flow */
import {
  GraphQLScalarType,
  GraphQLObjectType,
  GraphQLInterfaceType,
  type ObjectTypeDefinitionNode,
  type InterfaceTypeDefinitionNode,
  type ScalarTypeDefinitionNode,
  type GraphQLNamedType,
  isInterfaceType,
  isObjectType,
  isScalarType,
} from 'graphql';

const genUnknownScalarType = (
  name: string,
  astNode: ?ScalarTypeDefinitionNode,
) =>
  new GraphQLScalarType({
    name,
    description: 'Type declaration missing.',
    serialize: () => null,
    parseValue: () => false,
    parseLiteral: () => false,
    astNode,
    isPlaceholderType: true,
  });

// will be used to provide definition for unknown types
export const PLACEHOLDER_TYPES = {
  scalarType: genUnknownScalarType,
  inputType: genUnknownScalarType,
  outputType: genUnknownScalarType,
  objectType: (name: string, astNode: ?ObjectTypeDefinitionNode) =>
    new GraphQLObjectType({
      name,
      description: `unknown type '${name}'`,
      fields: {
        name: { type: genUnknownScalarType('unknown') },
      },
      interfaces: () => null,
      astNode,
      isPlaceholderType: true,
    }),
  interfaceType: (name: string, astNode: ?InterfaceTypeDefinitionNode) =>
    new GraphQLInterfaceType({
      name,
      description: `unknown interface type '${name}'`,
      fields: {
        unknown: { type: genUnknownScalarType('unknown') },
      },
      resolveType: () => {}, // eslint-disable-line no-empty-function
      astNode,
      isPlaceholderType: true,
    }),
};

export function isPlaceholderType(type: GraphQLNamedType): boolean {
  // const config = type._typeConfig || type._scalarConfig;
  let config = null;
  if (isObjectType(type) || isInterfaceType(type)) {
    config = type._typeConfig;
  }
  if (isScalarType(type)) {
    config = type._scalarConfig;
  }
  if (config && typeof config.isPlaceholderType === 'boolean') {
    return config.isPlaceholderType;
  }

  return false;
}
