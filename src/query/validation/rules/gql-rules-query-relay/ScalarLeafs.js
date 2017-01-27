/* @flow */
// patched ScalarLeaf
import {
  isLeafType,
  GraphQLError,
} from 'graphql';

import {
  noSubselectionAllowedMessage,
  requiredSubselectionMessage,
} from 'graphql/validation/rules/ScalarLeafs';

import { ValidationContext } from 'graphql/validation';

export {
  noSubselectionAllowedMessage,
  requiredSubselectionMessage,
};


function isRelayPatternDirective(node) {
  if (node.name.value !== 'relay') { return false; }
  return Boolean(
    node.arguments.find(argument => (
      argument.name.value === 'pattern' &&
      argument.value.value === true
    )),
  );
}

function isFragmentPattern(node): bool {
  return Boolean(
    node.directives
    .find(directive => isRelayPatternDirective(directive)),
  );
}

// relay
// 1) mutation { MutationName } // valid in relay
// 2) query { viewer } // valid in relay
function ignore(node, ancestors) {
  const ancestorsReveresed = ancestors.slice(0, ancestors.length).reverse();
  const found = ancestorsReveresed.find(_node => (
    _node.kind === 'OperationDefinition' ||
    (_node.kind === 'FragmentDefinition' && isFragmentPattern(_node))
  ));
  return Boolean(found);
  // return false;
}

export function ScalarLeafs(context: ValidationContext): any {
  return {
    Field(node, key, parent, path, ancestors) {
      const type = context.getType();
      if (type && !ignore(node, ancestors)) {
        if (isLeafType(type)) {
          if (node.selectionSet) {
            context.reportError(new GraphQLError(
              noSubselectionAllowedMessage(node.name.value, type),
              [node.selectionSet],
            ));
          }
        } else if (!node.selectionSet) {
          context.reportError(new GraphQLError(
            requiredSubselectionMessage(node.name.value, type),
            [node],
          ));
        }
      }
    },
  };
}
