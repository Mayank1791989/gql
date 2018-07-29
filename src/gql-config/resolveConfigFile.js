/* @flow */
import {
  type GQLConfigFile,
  type GQLConfigFileResolved,
  type ValidateConfig,
  type ValidateConfigResolved,
} from './types';
import { type IValidationContext } from 'gql-shared/types';
import { normalizeFragmentScopes } from 'gql-shared/FragmentScope';

import { loadQueryPresets, loadSchemaPresets } from './loadPresets';
import { loadSchemaParser, loadQueryParser } from './loadParser';
import { mergeQueryPresets, mergeSchemaPresets } from './mergePresets';

// will resolve all packages in config and normalize the config file
export default function resolveConfigFile(
  config: GQLConfigFile,
  configFilePath: string,
): GQLConfigFileResolved {
  const schemaPresets = loadSchemaPresets(
    config.schema.presets,
    configFilePath,
  );
  const schemaInlinePreset = {
    name: 'inline',
    parser: config.schema.parser,
    validate: config.schema.validate,
  };

  const schemaConfig = mergeSchemaPresets([
    ...schemaPresets,
    schemaInlinePreset,
  ]);

  const [SchemaParserClass, schemaParserOptions] = loadSchemaParser(
    schemaConfig.parser,
    configFilePath,
  );

  const schemaConfigResolved = {
    files: config.schema.files,
    validate: resolveValidateConfig(schemaConfig.validate),
    extendSchema: schemaConfig.extendSchema,
    parser: [
      SchemaParserClass,
      {
        // NOTE: preset should come first
        ...schemaConfig.parserOptions,
        ...schemaParserOptions,
      },
    ],
    ...(config.schema.graphQLOptions
      ? { graphQLOptions: config.schema.graphQLOptions }
      : {}),
  };

  if (!config.query) {
    return {
      schema: schemaConfigResolved,
      version: config.version,
    };
  }

  return {
    schema: schemaConfigResolved,
    query: {
      files: config.query.files.map(({ match, parser, presets, validate }) => {
        // load presets packages
        const queryPresets = loadQueryPresets(presets, configFilePath);
        const queryPresetInline = {
          name: 'inline',
          parser,
          validate,
        };
        // merge presets to generate config
        const presetConfig = mergeQueryPresets([
          ...queryPresets,
          queryPresetInline,
        ]);

        const [ParserClass, parserOptions] = loadQueryParser(
          // NOTE: settings in .gqlconfig overrides preset
          presetConfig.parser,
          configFilePath,
        );

        return {
          match,
          validate: resolveValidateConfig(
            presetConfig.validate,
            presetConfig.__overrides
              ? presetConfig.__overrides.ValidationContext
              : null,
          ),
          extendSchema: presetConfig.extendSchema,
          fragmentScopes: normalizeFragmentScopes(presetConfig.fragmentScopes),
          parser: [
            ParserClass,
            {
              ...presetConfig.parserOptions,
              ...parserOptions,
            },
          ],
          QueryContext: presetConfig.__overrides
            ? presetConfig.__overrides.QueryContext
            : null,
        };
      }),
    },
    version: config.version,
  };
}

function resolveValidateConfig(
  validateConfig: ?ValidateConfig,
  ValidationContext?: ?IValidationContext,
): ValidateConfigResolved {
  if (!validateConfig) {
    return {
      rules: [],
    };
  }

  const { rules, config } = validateConfig;
  const resolvedConfig: ValidateConfigResolved = {
    rules: rules
      ? Object.keys(rules).reduce((acc, ruleName) => {
          const rule = rules[ruleName];
          if (config[ruleName] && config[ruleName] !== 'off') {
            acc.push({
              rule,
              name: ruleName,
              severity: config[ruleName],
            });
          }
          return acc;
        }, [])
      : [],
  };

  if (ValidationContext) {
    resolvedConfig.ValidationContext = ValidationContext;
  }

  return resolvedConfig;
}
