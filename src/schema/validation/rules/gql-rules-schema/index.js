/* @flow */
import { NoUnusedTypeDefinition } from './NoUnusedTypeDefinition';
import { KnownDirectives } from 'graphql/validation/rules/KnownDirectives';
import { KnownArgumentNames } from 'graphql/validation/rules/KnownArgumentNames';
import { ArgumentsOfCorrectType } from 'graphql/validation/rules/ArgumentsOfCorrectType';
import { ProvidedNonNullArguments } from 'graphql/validation/rules/ProvidedNonNullArguments';
import { UniqueArgumentNames } from 'graphql/validation/rules/UniqueArgumentNames';
import { UniqueDirectivesPerLocation } from 'graphql/validation/rules/UniqueDirectivesPerLocation';

export default {
  rules: [
    NoUnusedTypeDefinition,
    KnownDirectives,
    KnownArgumentNames,
    ArgumentsOfCorrectType,
    ProvidedNonNullArguments,
    UniqueArgumentNames,
    UniqueDirectivesPerLocation,
  ],
  config: {
    NoUnusedTypeDefinition: 'warn',
    KnownDirectives: 'error',
    KnownArgumentNames: 'error',
    ArgumentsOfCorrectType: 'error',
    ProvidedNonNullArguments: 'error',
    UniqueArgumentNames: 'error',
    UniqueDirectivesPerLocation: 'error',
  },
};
