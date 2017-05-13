/* @flow */
import {
  GQLScalarType,
  GQLObjectType,
  GQLInterfaceType,
} from '../../shared/GQLTypes';

const genUnknownScalarType = (name: string) =>
  new GQLScalarType(null, {
    name,
    description: `Unknown scalar type '${name}'`,
    serialize: () => null,
    parseValue: () => false,
    parseLiteral: () => false,
  });

// will be used to provide definition for unknown types
export const PLACEHOLDER_TYPES = {
  scalarType: genUnknownScalarType,
  inputType: genUnknownScalarType,
  outputType: genUnknownScalarType,
  objectType: (name: string) =>
    new GQLObjectType(null, {
      name,
      description: `unknown type '${name}'`,
      fields: {
        name: { type: genUnknownScalarType('unknown') },
      },
      interfaces: () => null,
    }),
  interfaceType: (name: string) =>
    new GQLInterfaceType(null, {
      name,
      description: `unknown interface type '${name}'`,
      fields: {
        unknown: { type: genUnknownScalarType('unknown') },
      },
      resolveType: () => {}, // eslint-disable-line no-empty-function
    }),
};
