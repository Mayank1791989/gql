/* @flow */
import {
  type TypeNode,
  type NamedTypeNode,
  type EnumValueDefinitionNode,
  type FieldDefinitionNode,
  getDirectiveValues,
  GraphQLDeprecatedDirective,
  Kind,
} from 'graphql';

export function getNamedTypeNode(typeNode: TypeNode): NamedTypeNode {
  let namedType = typeNode;
  while (
    namedType.kind === Kind.LIST_TYPE ||
    namedType.kind === Kind.NON_NULL_TYPE
  ) {
    namedType = namedType.type;
  }
  return namedType;
}

/**
 * Given a field or enum value node, returns the string value for the
 * deprecation reason.
 */
export function getDeprecationReason(
  node: EnumValueDefinitionNode | FieldDefinitionNode,
): ?string {
  const deprecated = getDirectiveValues(GraphQLDeprecatedDirective, node);
  return deprecated && (deprecated.reason: any);
}
