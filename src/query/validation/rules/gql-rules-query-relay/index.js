/* @flow */
import query from '../gql-rules-query';
import replaceRules from '../_shared/replaceRules';

// patched rules
import { ProvidedNonNullArguments } from './ProvidedNonNullArguments';
import { ScalarLeafs } from './ScalarLeafs';

export default {
  rules: replaceRules(query.rules, [
    ScalarLeafs,
    ProvidedNonNullArguments,
  ]),

  config: {
    ...(query.config),
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
  },
};
