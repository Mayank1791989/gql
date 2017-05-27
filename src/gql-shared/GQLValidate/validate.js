/* @flow */
import { toGQLError, type GQLError } from '../GQLError';
import { type ValidationRules } from './types';
import TypeInfoContext from '../TypeInfoContext';

import {
  visit,
  visitInParallel,
  type DocumentNode,
  type ASTVisitor,
} from 'graphql';
import visitWithTypeInfo from './visitWithTypeInfo';

import ValidationTypeInfo from './ValidationTypeInfo';

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

export default function validate<
  TValidationContext,
  TValidationRule: { +create: (context: TValidationContext) => ASTVisitor },
>(
  typeInfoContext: TypeInfoContext,
  ast: DocumentNode,
  rules: ValidationRules<TValidationRule>,
): $ReadOnlyArray<GQLError> {
  const typeInfo = new ValidationTypeInfo(typeInfoContext);
  const validation = [rules].reduce(
    (acc, item) => {
      const context = item.createContext(ast, typeInfo);
      acc.contextList.push(context);
      item.config.rules.forEach(ruleConfig => {
        acc.visitors.push(
          ruleConfig.rule.create(makeRuleContext(context, ruleConfig)),
        );
      });
      return acc;
    },
    { visitors: [], contextList: [] },
  );

  if (validation.visitors.length === 0) {
    return [];
  }

  visit(ast, visitWithTypeInfo(typeInfo, visitInParallel(validation.visitors)));

  const errors = validation.contextList.reduce((acc, context) => {
    acc.push(...context.getErrors());
    return acc;
  }, []);

  return (errors: $FixMe);
}
