/* @flow */
import defaultPreset from 'gql-query-preset-default';
import { type QueryPreset } from 'gql-config/types';

import ConnectionDirective from './rules/ConnectionDirective';
import { createFieldsOnCorrectTypeRule } from './rules/FieldsOnCorrectType';

import extendSchema from './extendSchema';

export type Options = {|
  linkState: boolean,
|};

export default function queryPresetApolloGraphQL(
  options: Options,
): QueryPreset {
  const defaultPresetConfig = defaultPreset();

  return {
    parser: 'gql-query-parser-default',

    fragmentScopes: [('global': $FixMe)],

    extendSchema: extendSchema(options),

    validate: {
      rules: {
        ...(defaultPresetConfig.validate
          ? defaultPresetConfig.validate.rules
          : {}),
        ConnectionDirective,
        FieldsOnCorrectType: createFieldsOnCorrectTypeRule(
          Boolean(options.linkState),
        ),
      },

      config: {
        ...(defaultPresetConfig.validate
          ? defaultPresetConfig.validate.config
          : {}),
        // @TODO: enable this rule
        NoUnusedFragments: 'off',
        // [No-need]
        LoneAnonymousOperation: 'off',

        ConnectionDirective: 'error',
      },
    },
  };
}
