/* @flow */
import {
  isIntrospectionType,
  isObjectType,
  isInterfaceType,
  isUnionType,
  isScalarType,
  isEnumType,
  type GraphQLNamedType,
} from 'graphql';

export function isResolverType(type: GraphQLNamedType): boolean %checks {
  return (
    !isIntrospectionType(type) &&
    (isObjectType(type) ||
      isInterfaceType(type) ||
      isUnionType(type) ||
      isScalarType(type) ||
      isEnumType(type))
  );
}
