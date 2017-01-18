/* @flow */
import {
  ArgumentsOfCorrectType,
  badValueMessage as _badValueMessage,
} from 'graphql/validation/rules/ArgumentsOfCorrectType';

// import {
//   defaultForNonNullArgMessage,
//   badValueForDefaultArgMessage,
// } from 'graphql/validation/rules/DefaultValuesOfCorrectType';

import {
  FieldsOnCorrectType,
  undefinedFieldMessage,
} from 'graphql/validation/rules/FieldsOnCorrectType';

import {
  FragmentsOnCompositeTypes,
  inlineFragmentOnNonCompositeErrorMessage,
  fragmentOnNonCompositeErrorMessage,
} from 'graphql/validation/rules/FragmentsOnCompositeTypes';

import {
  KnownArgumentNames,
  unknownArgMessage,
  unknownDirectiveArgMessage,
} from 'graphql/validation/rules/KnownArgumentNames';

import {
  KnownDirectives,
  unknownDirectiveMessage,
  misplacedDirectiveMessage,
} from 'graphql/validation/rules/KnownDirectives';

// import {
//    KnownFragmentNames
// } from 'graphql/validation/rules/KnownFragmentNames';

import {
  KnownTypeNames,
  unknownTypeMessage,
} from 'graphql/validation/rules/KnownTypeNames';

// import {
//    LoneAnonymousOperation
// } from 'graphql/validation/rules/LoneAnonymousOperation';

// import {
//    NoFragmentCycles
// } from 'graphql/validation/rules/NoFragmentCycles';

// import {
//  NoUndefinedVariables
// } from 'graphql/validation/rules/NoUndefinedVariables';

// import {
//    NoUnusedFragments
// } from 'graphql/validation/rules/NoUnusedFragments';

// import {
//  NoUnusedVariables
// } from 'graphql/validation/rules/NoUnusedVariables';

import {
  OverlappingFieldsCanBeMerged,
  fieldsConflictMessage,
} from 'graphql/validation/rules/OverlappingFieldsCanBeMerged';

import {
  PossibleFragmentSpreads,
  typeIncompatibleSpreadMessage,
  typeIncompatibleAnonSpreadMessage,
} from 'graphql/validation/rules/PossibleFragmentSpreads';

// NOTE: this is patched rule
import {
  ProvidedNonNullArguments,
  missingFieldArgMessage,
  missingDirectiveArgMessage,
} from './ProvidedNonNullArguments';

// NOTE: this is patched ScalarLeafs rule
import {
  ScalarLeafs,
  noSubselectionAllowedMessage,
  requiredSubselectionMessage,
} from './ScalarLeafs';

import {
  UniqueArgumentNames,
  duplicateArgMessage,
} from 'graphql/validation/rules/UniqueArgumentNames';

// import {
//  UniqueFragmentNames
// } from 'graphql/validation/rules/UniqueFragmentNames';

import {
  UniqueInputFieldNames,
  duplicateInputFieldMessage,
} from 'graphql/validation/rules/UniqueInputFieldNames';

// import {
//  UniqueOperationNames
// } from 'graphql/validation/rules/UniqueOperationNames';

// import {
//  UniqueVariableNames
// } from 'graphql/validation/rules/UniqueVariableNames';

// import {
//  VariablesAreInputTypes
// } from 'graphql/validation/rules/VariablesAreInputTypes';

// import {
//  VariablesInAllowedPosition
// } from 'graphql/validation/rules/VariablesInAllowedPosition';

function badValueMessage(argName: string, typeName: string, value: string) {
  return (
    _badValueMessage(
      argName,
      typeName,
      value,
      [`Expected type "${typeName}", found ${value}.`],
    )
  );
}

const relayRules = [
  ArgumentsOfCorrectType,
  // DefaultValuesOfCorrectType [no-need default values are defined using initialvariables relay],
  FieldsOnCorrectType,
  FragmentsOnCompositeTypes,
  KnownArgumentNames,
  KnownDirectives,
  // KnownFragmentNames, [No-need]
  KnownTypeNames,
  // LoneAnonymousOperation [No-need]
  // NoFragmentCycles [no-need?]
  // NoUndefinedVariables [variables manage by relay no-need]
  // NoUnusedFragments [no need in relay unused fragments are like unused javascript variables]
  // NoUnusedVariables [variables manage by relay]
  OverlappingFieldsCanBeMerged,
  PossibleFragmentSpreads,
  ProvidedNonNullArguments,
  ScalarLeafs,
  UniqueArgumentNames,
  // UniqueFragmentNames [no-need: relay generates fragment names so they are unique]
  UniqueInputFieldNames,
  // UniqueOperationNames [no-need managed by relay]
  // UniqueVariablesName [no-need relay generates variables which are always unique]
  // VariablesAreInputTypes [managed by relay]
  // VariablesInAllowedPosition [managed by relay]
];

export default relayRules;

export {
  relayRules,

  // messages
  badValueMessage,
  undefinedFieldMessage,
  inlineFragmentOnNonCompositeErrorMessage,
  fragmentOnNonCompositeErrorMessage,
  unknownArgMessage,
  duplicateArgMessage,
  missingFieldArgMessage,
  missingDirectiveArgMessage,
  unknownDirectiveArgMessage,
  unknownDirectiveMessage,
  misplacedDirectiveMessage,
  unknownTypeMessage,
  fieldsConflictMessage,
  typeIncompatibleSpreadMessage,
  typeIncompatibleAnonSpreadMessage,
  noSubselectionAllowedMessage,
  requiredSubselectionMessage,
  duplicateInputFieldMessage,
};
