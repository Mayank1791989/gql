/* @flow */
import defaultPreset from '../gql-query-preset-default';
import extendSchema from './extendSchema';

import { type QueryPreset } from 'gql-config/types';

// patched rules
import { ProvidedNonNullArguments } from './rules/ProvidedNonNullArguments';
import { ScalarLeafs } from './rules/ScalarLeafs';
import { ExactlyOneDefinition } from './rules/ExactlyOneDefinition';

export default function queryPresetRelay(): QueryPreset {
  const defaultPresetConfig = defaultPreset();

  return {
    parser: [
      'gql-query-parser-embedded-queries',
      {
        start: 'Relay\\.QL`',
        end: '`',
      },
    ],

    parserOptions: {
      allowFragmentWithoutName: true,
      allowFragmentInterpolation: true,
    },

    extendSchema,

    validate: {
      rules: {
        ...(defaultPresetConfig.validate
          ? defaultPresetConfig.validate.rules
          : {}),
        ScalarLeafs,
        ProvidedNonNullArguments,
        ExactlyOneDefinition,
      },

      config: {
        ...(defaultPresetConfig.validate
          ? defaultPresetConfig.validate.config
          : {}),
        // [no-need default values are defined using initialvariables relay]
        DefaultValuesOfCorrectType: 'off',
        // [No-need]
        KnownFragmentNames: 'off',
        // [No-need]
        LoneAnonymousOperation: 'off',
        // [no-need?]
        NoFragmentCycles: 'off',
        // [variables manage by relay no-need]
        NoUndefinedVariables: 'off',
        // [no need in relay unused fragments are like unused javascript variables]
        NoUnusedFragments: 'off',
        // [variables manage by relay]
        NoUnusedVariables: 'off',
        // [no-need: relay generates fragment names so they are unique]
        UniqueFragmentNames: 'off',
        // [no-need managed by relay]
        UniqueOperationNames: 'off',
        // [no-need relay generates variables which are always unique]
        UniqueVariablesName: 'off',
        // [managed by relay]
        VariablesAreInputTypes: 'off',
        // [managed by relay]
        VariablesInAllowedPosition: 'off',

        //
        ExactlyOneDefinition: 'error',
      },
    },
  };
}
