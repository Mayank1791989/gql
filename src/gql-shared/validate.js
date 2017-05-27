/* @flow */
import { toGQLError, type GQLError } from './GQLError';
import { type ValidateConfigResolved } from 'gql-config/types';

import { visit, visitInParallel, type DocumentNode } from 'graphql';
import visitWithTypeInfo from './visitWithTypeInfo';

import ValidationContext from './ValidationContext';

const makeRuleContext = (context, rule) =>
  new Proxy(context, {
    get(target, key) {
      if (key === 'reportError') {
        return error => {
          error.message = `${error.message} (${rule.name})`;
          // $FlowDisableNextLine
          target[key](toGQLError(error, rule.severity));
        };
      }
      // $FlowDisableNextLine
      return target[key];
    },
  });

export default function validate(
  ast: DocumentNode,
  validateConfig: ValidateConfigResolved,
  validationContext: ValidationContext,
): Array<GQLError> {
  if (validateConfig.rules.length === 0) {
    return [];
  }
  const visitors = validateConfig.rules.map(ruleConfig =>
    ruleConfig.rule(makeRuleContext(validationContext, ruleConfig)),
  );
  visit(
    ast,
    visitWithTypeInfo(
      validationContext.getTypeInfo(),
      visitInParallel(visitors),
    ),
  );
  return (validationContext.getErrors(): any);
}
