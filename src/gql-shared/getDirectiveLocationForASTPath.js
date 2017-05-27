/* @flow */
import { Kind, DirectiveLocation, type DirectiveLocationEnum } from 'graphql';

export default function getDirectiveLocationForASTPath(
  ancestors,
): ?DirectiveLocationEnum {
  const appliedTo = ancestors[ancestors.length - 1];
  if (!Array.isArray(appliedTo)) {
    switch (appliedTo.kind) {
      case Kind.OPERATION_DEFINITION:
        switch (appliedTo.operation) {
          case 'query':
            return DirectiveLocation.QUERY;
          case 'mutation':
            return DirectiveLocation.MUTATION;
          case 'subscription':
            return DirectiveLocation.SUBSCRIPTION;
          default:
            return null;
        }
      case Kind.FIELD:
        return DirectiveLocation.FIELD;
      case Kind.FRAGMENT_SPREAD:
        return DirectiveLocation.FRAGMENT_SPREAD;
      case Kind.INLINE_FRAGMENT:
        return DirectiveLocation.INLINE_FRAGMENT;
      case Kind.FRAGMENT_DEFINITION:
        return DirectiveLocation.FRAGMENT_DEFINITION;
      case Kind.SCHEMA_DEFINITION:
        return DirectiveLocation.SCHEMA;
      case Kind.SCALAR_TYPE_DEFINITION:
      case Kind.SCALAR_TYPE_EXTENSION:
        return DirectiveLocation.SCALAR;
      case Kind.OBJECT_TYPE_DEFINITION:
      case Kind.OBJECT_TYPE_EXTENSION:
        return DirectiveLocation.OBJECT;
      case Kind.FIELD_DEFINITION:
        return DirectiveLocation.FIELD_DEFINITION;
      case Kind.INTERFACE_TYPE_DEFINITION:
      case Kind.INTERFACE_TYPE_EXTENSION:
        return DirectiveLocation.INTERFACE;
      case Kind.UNION_TYPE_DEFINITION:
      case Kind.UNION_TYPE_EXTENSION:
        return DirectiveLocation.UNION;
      case Kind.ENUM_TYPE_DEFINITION:
      case Kind.ENUM_TYPE_EXTENSION:
        return DirectiveLocation.ENUM;
      case Kind.ENUM_VALUE_DEFINITION:
        return DirectiveLocation.ENUM_VALUE;
      case Kind.INPUT_OBJECT_TYPE_DEFINITION:
      case Kind.INPUT_OBJECT_TYPE_EXTENSION:
        return DirectiveLocation.INPUT_OBJECT;
      case Kind.INPUT_VALUE_DEFINITION: {
        const parentNode = ancestors[ancestors.length - 3];
        return parentNode.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION
          ? DirectiveLocation.INPUT_FIELD_DEFINITION
          : DirectiveLocation.ARGUMENT_DEFINITION;
      }
      default:
        return null;
    }
  }
  return null;
}
