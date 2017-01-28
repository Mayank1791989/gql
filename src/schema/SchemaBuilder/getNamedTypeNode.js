/* @flow */
import {
  LIST_TYPE,
  NON_NULL_TYPE,
} from 'graphql/language/kinds';

import {
  type TypeNode,
  type NamedTypeNode,
} from 'graphql/language/ast';

export default function getNamedTypeNode(typeNode: TypeNode): NamedTypeNode {
  let namedType = typeNode;
  while (namedType.kind === LIST_TYPE || namedType.kind === NON_NULL_TYPE) {
    namedType = namedType.type;
  }
  return namedType;
}
