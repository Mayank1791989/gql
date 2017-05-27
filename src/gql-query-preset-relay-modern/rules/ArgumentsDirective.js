/* @flow */
import {
  type DirectiveNode,
  type FragmentSpreadNode,
  type FragmentDefinitionNode,
  Kind,
  GraphQLError,
  DirectiveLocation,
} from 'graphql';
import {
  QueryValidationContext,
  type FragmentVariableDefinition,
} from 'gql-query-service';

export function ArgumentsDirective(context: QueryValidationContext): any {
  return {
    FragmentSpread(node: FragmentSpreadNode) {
      // 2) if @arguments not used and argumentDefinitions contains some required values
      const fragmentName = node.name.value;
      const fragmentNode = context.getFragment(fragmentName);
      if (!fragmentNode) {
        return;
      }

      const argumentDefinitions = context.getFragmentVariableDefinitions(
        fragmentNode,
      );

      if (
        checkRequiredArgumentPresent(argumentDefinitions) &&
        !checkDirectivePresentOnFragment(node, 'arguments')
      ) {
        context.reportError(
          new GraphQLError(
            `Fragment '${fragmentName}' is expecting arguments. Use @arguments directive to pass arguments.`,
            [node],
          ),
        );
      }
    },

    Directive(node: DirectiveNode, key, parent, path, ancestors) {
      const directiveName = node.name.value;
      if (directiveName !== 'arguments') {
        return;
      }

      const appliedTo = ancestors[ancestors.length - 1];

      // 1) validate directive used on fragment_spread
      if (appliedTo.kind !== Kind.FRAGMENT_SPREAD) {
        context.reportError(
          new GraphQLError(
            `Directive "arguments" can only be used on '${
              DirectiveLocation.FRAGMENT_SPREAD
            }'.`,
            [node],
          ),
        );
        // let user first fixed the location before reporting any other error
        return;
      }

      // 2) check fragmentSpread fragment using argumentDefinitions
      const fragmentSpreadNode: FragmentSpreadNode = appliedTo;
      const fragmentName = fragmentSpreadNode.name.value;
      const fragmentNode = context.getFragment(fragmentName);
      if (!fragmentNode) {
        // ignore if fragment not found... let user first fixed unknown fragment here
        return;
      }

      if (
        !checkDirectivePresentOnFragment(fragmentNode, 'argumentDefinitions')
      ) {
        context.reportError(
          new GraphQLError(
            `Directive 'arguments' used on fragment '${fragmentName}' which is not expecting arguments (@argumentDefinitions missing on fragment).`,
            [node],
          ),
        );
      }

      // 3) Validate keys and value used in @arguments
      // NOTE: will be handled by Arguments rule
      // const fragmentVariables = context.getFragmentVariableDefinitions(
      //   fragmentNode,
      // );
      // console.log(fragmentVariables);
    },
  };
}

function checkRequiredArgumentPresent(
  argumentDefinitions: $ReadOnlyArray<FragmentVariableDefinition>,
): boolean {
  return Boolean(argumentDefinitions.find(argDef => !argDef.defaultValue));
}

function checkDirectivePresentOnFragment(
  node: FragmentSpreadNode | FragmentDefinitionNode,
  name: string,
): boolean {
  const { directives } = node;
  if (!directives) {
    return false;
  }
  return Boolean(directives.find(directive => directive.name.value === name));
}
