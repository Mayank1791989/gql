/* @flow */
import { type GQLConfigFile, type GQLConfigFileResolved } from './types';
import { normalizeFragmentScopes } from 'gql-shared/FragmentScope';
import { resolveValidateConfig } from 'gql-shared/GQLValidate';

import { loadQueryPresets, loadSchemaPresets } from './loadPresets';
import { loadSchemaParser, loadQueryParser } from './loadParser';
import { loadSchemaPlugins } from './loadPlugins';
import loadOptions from './loadOptions';
import PkgUtils from './PkgUtils';
import { mergeQueryPresets, mergeSchemaPresets } from './mergePresets';

// will resolve all packages in config and normalize the config file
export default function resolveConfigFile(
  config: GQLConfigFile,
  configDir: string,
): GQLConfigFileResolved {
  const options = loadOptions(config.options || null, configDir);
  const pkgUtils = new PkgUtils(options);

  const schemaPresets = loadSchemaPresets(config.schema.presets, pkgUtils);
  const schemaInlinePreset = {
    name: 'inline',
    preset: {
      parser: config.schema.parser,
      validate: config.schema.validate,
    },
  };

  const schemaConfig = mergeSchemaPresets([
    ...schemaPresets,
    schemaInlinePreset,
  ]);

  const schemaConfigResolved = {
    files: config.schema.files,
    validate: resolveValidateConfig(schemaConfig.validate),
    extendSchema: schemaConfig.extendSchema,
    parser: loadSchemaParser(
      schemaConfig.parser,
      schemaConfig.parserOptions,
      pkgUtils,
    ),
    ...(config.schema.graphQLOptions
      ? { graphQLOptions: config.schema.graphQLOptions }
      : {}),

    plugins: loadSchemaPlugins(config.schema.plugins, pkgUtils),
  };

  if (!config.query) {
    return {
      schema: schemaConfigResolved,
      version: config.version,
      options,
    };
  }

  return {
    schema: schemaConfigResolved,
    query: {
      files: config.query.files.map(({ match, parser, presets, validate }) => {
        // load presets packages
        const queryPresets = loadQueryPresets(presets, pkgUtils);
        const queryPresetInline = {
          name: 'inline',
          preset: {
            parser,
            validate,
          },
        };
        // merge presets to generate config
        const presetConfig = mergeQueryPresets([
          ...queryPresets,
          queryPresetInline,
        ]);

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
          parser: loadQueryParser(
            presetConfig.parser,
            presetConfig.parserOptions,
            pkgUtils,
          ),
          QueryContext: presetConfig.__overrides
            ? presetConfig.__overrides.QueryContext
            : null,
        };
      }),
    },
    version: config.version,
    options,
  };
}
