/* @flow */
import { visit, visitInParallel } from '../language/visitor';
import { type ResolverDocumentNode } from '../language/ast';
import { type TypeResolverValidationRule } from '../validation/types';
import ResolverValidationContext from './ResolverValidationContext';
import { type ValidateConfigResolved } from 'gql-shared/GQLValidate/types';
import { type GQLError } from 'gql-shared/GQLError';
import { toGQLError } from '../error';

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
  context: ResolverValidationContext,
  ast: ResolverDocumentNode,
  config: ValidateConfigResolved<TypeResolverValidationRule>,
): $ReadOnlyArray<GQLError> {
  const visitors = config.rules.map(rule => {
    return rule.rule.create(makeRuleContext(context, rule));
  });

  visit(ast, visitInParallel(visitors));

  return (context.getErrors(): $FixMe);
}
