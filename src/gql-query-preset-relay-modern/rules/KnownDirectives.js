/* @flow */
import { KnownDirectivesRule as origKnownDirectivesRule } from 'graphql';

const IGNORE_DIRECTIVES = ['argumentDefinitions', 'arguments'];

export function KnownDirectives(context: any): any {
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
}
