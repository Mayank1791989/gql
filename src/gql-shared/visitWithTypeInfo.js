/* @flow */
/* eslint-disable init-declarations */
/**
 * Patch original function to pass all arguments to TypeInfo functions
 */

import { TypeInfo, getVisitFn } from 'graphql';

export default function visitWithTypeInfo(
  typeInfo: TypeInfo,
  visitor: Visitor<ASTKindToNode>,
): Visitor<ASTKindToNode> {
  return {
    // eslint-disable-next-line consistent-return
    enter(...args) {
      const [node, ...otherArgs] = args;
      typeInfo.enter(...args);
      const fn = getVisitFn(visitor, node.kind, /* isLeaving */ false);
      if (fn) {
        const result = fn.apply(visitor, args);
        if (result !== undefined) {
          typeInfo.leave(node);
          if (isNode(result)) {
            typeInfo.enter(result, ...otherArgs);
          }
        }
        return result;
      }
    },
    leave(...args) {
      const [node, ...otherArgs] = args;
      const fn = getVisitFn(visitor, node.kind, /* isLeaving */ true);
      let result;
      if (fn) {
        result = fn.apply(visitor, args);
      }
      typeInfo.leave(node, ...otherArgs);
      return result;
    },
  };
}

function isNode(maybeNode): boolean %checks {
  return Boolean(maybeNode && typeof maybeNode.kind === 'string');
}
