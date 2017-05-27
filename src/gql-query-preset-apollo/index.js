/* @flow */
import defaultPreset from 'gql-query-preset-default';

import ConnectionDirective from './rules/ConnectionDirective';
import { createFieldsOnCorrectTypeRule } from './rules/FieldsOnCorrectType';

import extendSchema from './extendSchema';

type Options = {
  linkState: boolean,
};

export default function queryPresetApollo(options: Options) {
  const defaultPresetConfig = defaultPreset();

  return {
    parser: [
      'gql-query-parser-embedded-queries',
      {
        start: 'gql`',
        end: '`',
      },
    ],

    parserOptions: {
      allowDocumentInterpolation: true,
    },

    fragmentScopes: ['global'],

    extendSchema: extendSchema(options),

    validate: {
      rules: {
        ...defaultPresetConfig.validate.rules,
        ConnectionDirective,
        FieldsOnCorrectType: createFieldsOnCorrectTypeRule(options.linkState),
      },

      config: {
        ...defaultPresetConfig.validate.config,
        // [No-need not possible in apollo]
        KnownFragmentNames: 'error',
        // [no need: its very hard to detect correctly in apollo]
        NoUnusedFragments: 'off',
        // [No-need]
        LoneAnonymousOperation: 'off',

        ConnectionDirective: 'error',
      },
    },
  };
}
