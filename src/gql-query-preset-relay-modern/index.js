/* @flow */
import defaultPreset from 'gql-query-preset-default';
import relayClassicPreset from 'gql-query-preset-relay';
import extendSchema from './extendSchema';

import { ExactlyOneOperation } from './rules/ExactlyOneOperation';
import { RequiredDefinitionName } from './rules/RequiredDefinitionName';
import { KnownDirectives } from './rules/KnownDirectives';

import { ConnectionDirective } from './rules/ConnectionDirective';
import { ArgumentDefinitionsDirective } from './rules/ArgumentDefinitionsDirective';
import { ArgumentsDirective } from './rules/ArgumentsDirective';
import { NoUndefinedVariables } from './rules/NoUndefinedVariables';
import { VariablesInAllowedPosition } from './rules/VariablesInAllowedPosition';
import { BREAK } from 'graphql';
import _union from 'lodash/union';
import invariant from 'invariant';

import ValidationContext from './overrides/ValidationContext';
import QueryContext from './overrides/QueryContext';
import { type QueryPreset } from 'gql-config/types';
import { type QueryValidationRule } from 'gql-query-service';
import { type ValidateConfig } from 'gql-shared/GQLValidate/types';

type Options = {
  compact: boolean,
  classic: boolean,
};

export default function relayModernPreset(options: Options): QueryPreset {
  return {
    parser: [
      'gql-query-parser-embedded-queries',
      {
        start: options.classic
          ? 'Relay\\.QL`|graphql(?:\\.experimental)?`'
          : 'graphql(?:\\.experimental)?`',
        end: '`',
      },
    ],

    parserOptions: {
      allowFragmentWithoutName: Boolean(options.classic),
      allowFragmentInterpolation: Boolean(options.classic),
    },

    fragmentScopes: ['global'],

    extendSchema,

    validate: options.classic
      ? addClassicSupport(getValidate())
      : getValidate(),

    __overrides: {
      ValidationContext,
      QueryContext,
    },
  };
}

function getValidate(): ValidateConfig<QueryValidationRule> {
  const defaultPresetConfig = defaultPreset();

  return {
    rules: {
      ...(defaultPresetConfig.validate
        ? defaultPresetConfig.validate.rules
        : {}),
      ExactlyOneOperation,
      RequiredDefinitionName,
      KnownDirectives,
      ConnectionDirective,
      ArgumentDefinitionsDirective,
      ArgumentsDirective,
      NoUndefinedVariables,
      VariablesInAllowedPosition,
    },
    config: {
      ...(defaultPresetConfig.validate
        ? defaultPresetConfig.validate.config
        : {}),

      ...{
        ExactlyOneOperation: 'error',
        RequiredDefinitionName: 'error',
      },

      ...{
        // see required definition name
        RequiredOperationName: 'off',
        ExecutableDefinitions: 'error',
        // No Need only one operation allowed per tag
        UniqueOperationNames: 'off',
        // Not valid in relay-modern
        LoneAnonymousOperation: 'off',
        SingleFieldSubscriptions: 'error',
        KnownTypeNames: 'error',
        FragmentsOnCompositeTypes: 'error',
        OverlappingFieldsCanBeMerged: 'error',

        VariablesAreInputTypes: 'error',

        VariablesInAllowedPosition: 'error',

        VariablesDefaultValueAllowed: 'error',
        ScalarLeafs: 'error',
        FieldsOnCorrectType: 'error',

        UniqueFragmentNames: 'error',
        // FIXME: enable this rule ??
        NoUnusedFragments: 'off',
        // FIXME: enable this rule ??
        NoFragmentCycles: 'off',

        KnownFragmentNames: 'error',
        // FIX: errors for fragmentSpread and fragment in other files
        PossibleFragmentSpreads: 'error',

        UniqueVariableNames: 'error',

        NoUndefinedVariables: 'error',

        NoUnusedVariables: 'error',

        KnownDirectives: 'error',

        UniqueDirectivesPerLocation: 'error',
        KnownArgumentNames: 'error',
        UniqueArgumentNames: 'error',
        ProvidedNonNullArguments: 'error',

        ValuesOfCorrectType: 'error',

        UniqueInputFieldNames: 'error',

        ConnectionDirective: 'error',
        ArgumentDefinitionsDirective: 'error',
        ArgumentsDirective: 'error',
      },
    },
  };
}

function addClassicSupport(modern) {
  const classic = relayClassicPreset().validate;
  invariant(modern.rules, 'expected modern.rules missing');
  invariant(classic, 'missing classic validate');
  invariant(classic.rules, 'missing classic.rules');

  // NOTE: merging modern and classic
  // 1) Rule present only in one of preset:
  // rule: Use NoopRule in missing preset
  // config: enable rule
  // 2) Rule disable in one of the preset:
  // config: enable rule
  // rule: Use NoopRule in disabled preset
  const rules = _union(
    Object.keys(modern.rules),
    Object.keys(classic.rules || {}),
  ).reduce((acc, ruleName) => {
    acc[ruleName] = switchRule({
      modern: getRule(ruleName, modern),
      classic: getRule(ruleName, classic),
    });
    return acc;
  }, {});

  const config = _union(
    Object.keys(modern.config),
    Object.keys(classic.config),
  ).reduce((acc, ruleName) => {
    acc[ruleName] =
      !modern.config[ruleName] || modern.config[ruleName] === 'off'
        ? classic.config[ruleName]
        : modern.config[ruleName];
    return acc;
  }, {});

  return {
    rules,
    config,
  };
}

function getRule(ruleName, validate) {
  if (!validate.rules[ruleName] || validate.config[ruleName] === 'off') {
    return NoopRule;
  }
  return validate.rules[ruleName];
}

function isRelayClassic(context: ValidationContext) {
  const { start } = context.getQueryDocument().getParserMatch();
  return start.startsWith('Relay.QL');
}

// eslint-disable-next-line
function NoopRule(context) {
  return {
    Document: {
      enter() {
        return BREAK;
      },
    },
  };
}

function switchRule({ modern, classic }) {
  return function rule(context) {
    return isRelayClassic(context) ? classic(context) : modern(context);
  };
}
