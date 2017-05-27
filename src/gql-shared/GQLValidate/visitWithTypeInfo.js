/* @flow */
/* eslint-disable init-declarations */
/**
 * Patch original function to pass all arguments to TypeInfo functions
 */

import { getVisitFn, type Visitor, type ASTKindToNode } from 'graphql';
import ValidateTypeInfo from './ValidationTypeInfo';

export default function visitWithTypeInfo(
  typeInfo: ValidateTypeInfo,
  visitor: Visitor<ASTKindToNode>,
): Visitor<ASTKindToNode> {
  return {
    // eslint-disable-next-line consistent-return
    enter(node, key, parent, path, ancestors) {
      typeInfo.enter(node, key, parent, path, ancestors);
      const fn = getVisitFn(visitor, node.kind, /* isLeaving */ false);
      if (fn) {
        const result = fn.apply(visitor, [node, key, parent, path, ancestors]);
        if (result !== undefined) {
          typeInfo.leave(node);
          if (isNode(result)) {
            typeInfo.enter(result, key, parent, path, ancestors);
          }
        }
        return result;
      }
    },
    leave(node, key, parent, path, ancestors) {
      const fn = getVisitFn(visitor, node.kind, /* isLeaving */ true);
      let result;
      if (fn) {
        result = fn.apply(visitor, [node, key, parent, path, ancestors]);
      }
      typeInfo.leave(node);
      return result;
    },
  };
}

function isNode(maybeNode): boolean %checks {
  return Boolean(maybeNode && typeof maybeNode.kind === 'string');
}
