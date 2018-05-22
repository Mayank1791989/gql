/* @flow */
import { NoUnusedTypeDefinition } from './NoUnusedTypeDefinition';
import { KnownDirectives } from 'graphql/validation/rules/KnownDirectives';
import { KnownArgumentNames } from 'graphql/validation/rules/KnownArgumentNames';
import { ValuesOfCorrectType } from 'graphql/validation/rules/ValuesOfCorrectType';
import { ProvidedNonNullArguments } from 'graphql/validation/rules/ProvidedNonNullArguments';
import { UniqueArgumentNames } from 'graphql/validation/rules/UniqueArgumentNames';
import { UniqueDirectivesPerLocation } from 'graphql/validation/rules/UniqueDirectivesPerLocation';

export default {
  rules: [
    NoUnusedTypeDefinition,
    KnownDirectives,
    KnownArgumentNames,
    ValuesOfCorrectType,
    ProvidedNonNullArguments,
    UniqueArgumentNames,
    UniqueDirectivesPerLocation,
  ],
  config: {
    NoUnusedTypeDefinition: 'warn',
    KnownDirectives: 'error',
    KnownArgumentNames: 'error',
    ValuesOfCorrectType: 'error',
    ProvidedNonNullArguments: 'error',
    UniqueArgumentNames: 'error',
    UniqueDirectivesPerLocation: 'error',
  },
};
