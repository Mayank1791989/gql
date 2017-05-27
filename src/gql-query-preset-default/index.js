/* @flow */
import { type QueryPreset } from 'gql-config/types';
import { toGQLValidationRule } from 'gql-shared/GQLValidate';
import { type QueryValidationRule } from 'gql-query-service';
import { specifiedRules } from 'graphql/validation/specifiedRules';

// modified rules
import { RequiredOperationName } from './rules/RequiredOperationName';
import { ExecutableDefinitions } from './rules/ExecutableDefinitions';

export default function queryPresetDefault(): QueryPreset {
  const coreRules = specifiedRules.reduce((acc, rule) => {
    acc[rule.name] = toGQLValidationRule(rule);
    return acc;
  }, ({}: { [name: string]: QueryValidationRule }));

  return {
    parser: 'gql-query-parser-default',

    parserOptions: {},

    validate: {
      rules: {
        ...coreRules,
        RequiredOperationName,
        ExecutableDefinitions,
      },

      config: Object.keys(coreRules).reduce(
        (acc, rule) => {
          acc[rule] = 'error';
          return acc;
        },
        {
          RequiredOperationName: 'warn',
          ExecutableDefinitions: 'error',
        },
      ),
    },
  };
}
