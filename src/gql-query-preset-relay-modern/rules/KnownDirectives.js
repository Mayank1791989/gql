/* @flow */
import { KnownDirectivesRule as origKnownDirectivesRule } from 'graphql';
import { type QueryValidationRule } from 'gql-query-service';

const IGNORE_DIRECTIVES = ['argumentDefinitions', 'arguments'];

export function KnownDirectives(): QueryValidationRule {
  return {
    create(context) {
      const originalRule = origKnownDirectivesRule(context);

      return {
        Directive(...args) {
          const [node] = args;
          const directiveName = node.name.value;

          if (IGNORE_DIRECTIVES.includes(directiveName)) {
            return;
          }

          // $FlowDisableNextLine
          originalRule.Directive(...args);
        },
      };
    },
  };
}
