/* eslint-disable init-declarations, no-continue, no-nested-ternary, prefer-destructuring, max-depth, consistent-return, no-use-before-define */
/* @flow */
import { type ResolverDocumentNode, type ASTKindToNode } from './ast';

export type ASTVisitor = Visitor<ASTKindToNode>;
/**
 * A visitor is comprised of visit functions, which are called on each node
 * during the visitor's traversal.
 */
export type VisitFn<TAnyNode, TVisitedNode: TAnyNode = TAnyNode> = (
  // The current node being visiting.
  node: TVisitedNode,
  // The index or key to this node from the parent node or Array.
  key: string | number | void,
  // The parent immediately above this node, which may be an Array.
  parent: TAnyNode | $ReadOnlyArray<TAnyNode> | void,
  // The key path to get to this node from the root node.
  path: $ReadOnlyArray<string | number>,
  // All nodes and Arrays visited before reaching parent of this node.
  // These correspond to array indices in `path`.
  // Note: ancestors includes arrays which contain the parent of visited node.
  ancestors: $ReadOnlyArray<TAnyNode | $ReadOnlyArray<TAnyNode>>,
) => any;

type EnterLeave<T> = {| +enter?: T, +leave?: T |};
type ShapeMap<O, F> = $Shape<$ObjMap<O, F>>;
export type Visitor<KindToNode, Nodes = $Values<KindToNode>> =
  | EnterLeave<
      | VisitFn<Nodes>
      | ShapeMap<KindToNode, <Node>(Node) => VisitFn<Nodes, Node>>,
    >
  | ShapeMap<
      KindToNode,
      <Node>(Node) => VisitFn<Nodes, Node> | EnterLeave<VisitFn<Nodes, Node>>,
    >;

/**
 * A KeyMap describes each the traversable properties of each kind of node.
 */
export type VisitorKeyMap<KindToNode> = $ObjMap<
  KindToNode,
  <T>(T) => $ReadOnlyArray<$Keys<T>>,
>;

export const BREAK = Object.freeze({});

const ResolverDocumentKeys = {
  Name: [],
  ResolverDocument: ['resolvers'],
  TypeResolver: ['name'],
  FieldResolver: ['type', 'name'],
  ObjectTypeResolver: ['name'],
  ObjectFieldResolver: ['type', 'name'],
  ResolveTypeResolver: ['name'],
  ScalarTypeResolver: ['name'],
  EnumTypeResolver: ['name'],
  EnumValueResolver: ['type', 'name'],
  DirectiveResolver: ['name'],
};

export function visit(
  root: ResolverDocumentNode,
  visitor: Visitor<ASTKindToNode>,
  visitorKeys: VisitorKeyMap<ASTKindToNode> = ResolverDocumentKeys,
): any {
  /* eslint-disable no-undef-init */
  let stack: any = undefined;
  let inArray = Array.isArray(root);
  let keys: any = [root];
  let index = -1;
  let edits = [];
  let node: any = undefined;
  let key: any = undefined;
  let parent: any = undefined;
  const path: any = [];
  const ancestors = [];
  let newRoot = root;
  /* eslint-enable no-undef-init */

  do {
    index += 1;
    const isLeaving = index === keys.length;
    const isEdited = isLeaving && edits.length !== 0;
    if (isLeaving) {
      key = ancestors.length === 0 ? undefined : path[path.length - 1];
      node = parent;
      parent = ancestors.pop();
      if (isEdited) {
        if (inArray) {
          node = node.slice();
        } else {
          const clone = {};
          for (const k of Object.keys(node)) {
            clone[k] = node[k];
          }
          node = clone;
        }
        let editOffset = 0;
        for (let ii = 0; ii < edits.length; ii += 1) {
          let editKey: any = edits[ii][0];
          const editValue = edits[ii][1];
          if (inArray) {
            editKey -= editOffset;
          }
          if (inArray && editValue === null) {
            node.splice(editKey, 1);
            editOffset += 1;
          } else {
            node[editKey] = editValue;
          }
        }
      }
      index = stack.index;
      keys = stack.keys;
      edits = stack.edits;
      inArray = stack.inArray;
      stack = stack.prev;
    } else {
      key = parent ? (inArray ? index : keys[index]) : undefined;
      node = parent ? parent[key] : newRoot;
      if (node === null || node === undefined) {
        continue;
      }
      if (parent) {
        path.push(key);
      }
    }

    let result;
    if (!Array.isArray(node)) {
      if (!isNode(node)) {
        throw new Error(`Invalid AST Node: ${JSON.stringify(node)}`);
      }
      const visitFn = getVisitFn(visitor, node.kind, isLeaving);
      if (visitFn) {
        result = visitFn.call(visitor, node, key, parent, path, ancestors);

        if (result === BREAK) {
          break;
        }

        if (result === false) {
          if (!isLeaving) {
            path.pop();
            continue;
          }
        } else if (result !== undefined) {
          edits.push([key, result]);
          if (!isLeaving) {
            if (isNode(result)) {
              node = result;
            } else {
              path.pop();
              continue;
            }
          }
        }
      }
    }

    if (result === undefined && isEdited) {
      edits.push([key, node]);
    }

    if (isLeaving) {
      path.pop();
    } else {
      stack = { inArray, index, keys, edits, prev: stack };
      inArray = Array.isArray(node);
      keys = inArray ? node : visitorKeys[node.kind] || [];
      index = -1;
      edits = [];
      if (parent) {
        ancestors.push(parent);
      }
      parent = node;
    }
  } while (stack !== undefined);

  if (edits.length !== 0) {
    newRoot = edits[edits.length - 1][1];
  }

  return newRoot;
}

function isNode(maybeNode): boolean %checks {
  return Boolean(maybeNode && typeof maybeNode.kind === 'string');
}

/**
 * Creates a new visitor instance which delegates to many visitors to run in
 * parallel. Each visitor will be visited for each node before moving on.
 *
 * If a prior visitor edits a node, no following visitors will see that node.
 */
export function visitInParallel(
  visitors: Array<Visitor<ASTKindToNode>>,
): Visitor<ASTKindToNode> {
  const skipping = new Array(visitors.length);

  return {
    enter(...args) {
      const [node] = args;
      for (let i = 0; i < visitors.length; i += 1) {
        if (!skipping[i]) {
          const fn = getVisitFn(visitors[i], node.kind, /* isLeaving */ false);
          if (fn) {
            const result = fn.apply(visitors[i], args);
            if (result === false) {
              skipping[i] = node;
            } else if (result === BREAK) {
              skipping[i] = BREAK;
            } else if (result !== undefined) {
              return result;
            }
          }
        }
      }
    },
    leave(...args) {
      const [node] = args;

      for (let i = 0; i < visitors.length; i += 1) {
        if (!skipping[i]) {
          const fn = getVisitFn(visitors[i], node.kind, /* isLeaving */ true);
          if (fn) {
            const result = fn.apply(visitors[i], args);
            if (result === BREAK) {
              skipping[i] = BREAK;
            } else if (result !== undefined && result !== false) {
              return result;
            }
          }
        } else if (skipping[i] === node) {
          skipping[i] = null;
        }
      }
    },
  };
}

/**
 * Given a visitor instance, if it is leaving or not, and a node kind, return
 * the function the visitor runtime should call.
 */
export function getVisitFn(
  visitor: Visitor<any>,
  kind: string,
  isLeaving: boolean,
): ?VisitFn<any> {
  const kindVisitor = visitor[kind];
  if (kindVisitor) {
    if (!isLeaving && typeof kindVisitor === 'function') {
      // { Kind() {} }
      return kindVisitor;
    }
    const kindSpecificVisitor = isLeaving
      ? kindVisitor.leave
      : kindVisitor.enter;
    if (typeof kindSpecificVisitor === 'function') {
      // { Kind: { enter() {}, leave() {} } }
      return kindSpecificVisitor;
    }
  } else {
    const specificVisitor = isLeaving ? visitor.leave : visitor.enter;
    if (specificVisitor) {
      if (typeof specificVisitor === 'function') {
        // { enter() {}, leave() {} }
        return specificVisitor;
      }
      const specificKindVisitor = specificVisitor[kind];
      if (typeof specificKindVisitor === 'function') {
        // { enter: { Kind() {} }, leave: { Kind() {} } }
        return specificKindVisitor;
      }
    }
  }
}
