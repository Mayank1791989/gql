/* @flow */
import keymirror from 'keymirror';
import {
  GraphQLScalarType,
  GraphQLObjectType,
  GraphQLInterfaceType,
} from 'graphql/type/definition';

export const SERVER_NAME = 'gql-server';

export const SEVERITY = keymirror({
  error: null,
  warn: null,
});

const PLACEHOLDER_SCALAR_TYPE = new GraphQLScalarType({
  name: 'placeholder_scalar',
  description: 'description for type',
  serialize: () => null,
  parseValue: () => false,
  parseLiteral: () => false,
});

// will be used to provide definition for unknown types
export const PLACEHOLDER_TYPES = {
  scalarType: PLACEHOLDER_SCALAR_TYPE,
  inputType: PLACEHOLDER_SCALAR_TYPE,
  outputType: PLACEHOLDER_SCALAR_TYPE,
  objectType: new GraphQLObjectType({
    name: 'placeholder_objectType',
    description: 'placeholder any',
    fields: {
      name: { type: PLACEHOLDER_SCALAR_TYPE },
    },
    interfaces: () => null,
  }),
  interfaceType: new GraphQLInterfaceType({
    name: 'placeholder_interface',
    fields: {
      name: { type: PLACEHOLDER_SCALAR_TYPE },
    },
    resolveType: () => {},
  }),
};
