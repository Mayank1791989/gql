/* @flow */
// patched ScalarLeaf
import {
  noSubselectionAllowedMessage,
  requiredSubselectionMessage,
  ScalarLeafs as GraphqlScalarLeafs,
} from 'graphql/validation/rules/ScalarLeafs';

import { ValidationContext } from 'graphql/validation';

export {
  noSubselectionAllowedMessage,
  requiredSubselectionMessage,
};


function isRelayPatternDirective(node) {
  if (node.name.value !== 'relay') { return false; }
  return Boolean(
    node.arguments.find((argument) => (
      argument.name.value === 'pattern' &&
      argument.value.value === true
    )),
  );
}

function isFragmentPattern(node): boolean {
  return Boolean(
    node.directives
      .find((directive) => isRelayPatternDirective(directive)),
  );
}

// relay
// 1) mutation { MutationName } // valid in relay
// 2) query { viewer } // valid in relay
function ignore(node, ancestors) {
  const ancestorsReveresed = ancestors.slice(0, ancestors.length).reverse();
  const found = ancestorsReveresed.find((_node) => (
    _node.kind === 'OperationDefinition' ||
    (_node.kind === 'FragmentDefinition' && isFragmentPattern(_node))
  ));
  return Boolean(found);
}

export function ScalarLeafs(context: ValidationContext): any {
  const origScalarLeafs = GraphqlScalarLeafs(context);
  return {
    ...origScalarLeafs,
    Field(...args) {
      const [
        node,
        key, // eslint-disable-line
        parent, // eslint-disable-line
        path, // eslint-disable-line
        ancestors,
      ] = args;
      const type = context.getType();
      if (type && !ignore(node, ancestors)) {
        origScalarLeafs.Field(...args);
      }
    },
  };
}
