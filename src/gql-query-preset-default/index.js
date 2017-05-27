/* @flow */
import { specifiedRules } from 'graphql/validation/specifiedRules';

// modified rules
import { RequiredOperationName } from './rules/RequiredOperationName';
import { ExecutableDefinitions } from './rules/ExecutableDefinitions';

export default function queryPresetDefault() {
  const coreRules = specifiedRules.reduce((acc, rule) => {
    acc[rule.name] = rule;
    return acc;
  }, {});

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
