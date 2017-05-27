/* @flow */
import {
  type GraphQLNamedType,
  isObjectType,
  isInterfaceType,
  isInputObjectType,
} from 'graphql';

export default function isFieldsType(type: GraphQLNamedType): boolean %checks {
  return isObjectType(type) || isInterfaceType(type) || isInputObjectType(type);
}
