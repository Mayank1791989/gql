/* @flow */
import { NoUnusedTypeDefinition } from './rules/NoUnusedTypeDefinition';

import { KnownDirectives } from 'graphql/validation/rules/KnownDirectives';
import { KnownArgumentNames } from 'graphql/validation/rules/KnownArgumentNames';
import { ProvidedNonNullArguments } from 'graphql/validation/rules/ProvidedNonNullArguments';
import { UniqueArgumentNames } from 'graphql/validation/rules/UniqueArgumentNames';
import { UniqueDirectivesPerLocation } from 'graphql/validation/rules/UniqueDirectivesPerLocation';
import { ValuesOfCorrectType } from 'graphql/validation/rules/ValuesOfCorrectType';
import { toGQLValidationRule } from 'gql-shared/GQLValidate';

import { type SchemaPreset } from 'gql-config/types';

export default function schemaPresetDefault(): SchemaPreset {
  return {
    parser: 'gql-schema-parser-default',

    validate: {
      rules: {
        NoUnusedTypeDefinition,
        KnownDirectives: toGQLValidationRule(KnownDirectives),
        KnownArgumentNames: toGQLValidationRule(KnownArgumentNames),
        ProvidedNonNullArguments: toGQLValidationRule(ProvidedNonNullArguments),
        UniqueArgumentNames: toGQLValidationRule(UniqueArgumentNames),
        UniqueDirectivesPerLocation: toGQLValidationRule(
          UniqueDirectivesPerLocation,
        ),
        ValuesOfCorrectType: toGQLValidationRule(ValuesOfCorrectType),
      },
      config: {
        NoUnusedTypeDefinition: 'warn',
        KnownDirectives: 'error',
        KnownArgumentNames: 'error',
        ProvidedNonNullArguments: 'error',
        UniqueArgumentNames: 'error',
        UniqueDirectivesPerLocation: 'error',
        ValuesOfCorrectType: 'error',
      },
    },
  };
}
