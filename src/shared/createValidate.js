/* @flow */
import { type DocumentNode } from 'graphql/language/ast';
import { type GQLSchema } from './GQLTypes';
import { type ValidateConfig } from '../config/GQLConfig';
import { toGQLError, type GQLError } from './GQLError';
import { type ValidationRulesPackage } from './types';

import { ValidationContext } from 'graphql/validation/validate';
import { TypeInfo } from 'graphql/utilities/TypeInfo';
import { visit, visitInParallel, visitWithTypeInfo } from 'graphql/language/visitor';

import _memoize from 'lodash/memoize';
import invariant from 'invariant';

export default function createValidate(
  availableRulesPackage: { [pkgName: string]: ValidationRulesPackage },
) {
  const genRulesFromConfig = _memoize((validateConfig: ValidateConfig) => {
    const base = availableRulesPackage[validateConfig.extends];
    invariant(base, `unknown validate extends '${validateConfig.extends}' available [${Object.keys(availableRulesPackage).join(',')}]`);
    const config = {
      ...base.config,
      ...validateConfig.rules,
    };

    // remove all 'off' rules
    const rules = base.rules.filter((rule) => config[rule.name] !== 'off');

    return { config, rules };
  });

  const makeRuleContext = (context, rule, config) => (
    new Proxy(context, {
      get(target, key) {
        if (key === 'reportError') {
          return (error) => {
            error.message = `${error.message} (${rule.name})`;
            // $FlowDisableNextLine
            target[key](toGQLError(error, config[rule.name]));
          };
        }
        // $FlowDisableNextLine
        return target[key];
      },
    })
  );

  const validate = (
    schema: GQLSchema,
    ast: DocumentNode,
    validateConfig: ValidateConfig,
  ): Array<GQLError> => {
    const { rules, config } = genRulesFromConfig(validateConfig);
    const _schema: any = schema;
    const typeInfo = new TypeInfo(_schema);
    const context = new ValidationContext(_schema, ast, typeInfo);
    const visitors = rules.map((rule) => rule(makeRuleContext(context, rule, config)));
    visit(ast, visitWithTypeInfo(typeInfo, visitInParallel(visitors)));
    return (context.getErrors(): any);
  };

  return validate;
}

