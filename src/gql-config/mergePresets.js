/* @flow */
import {
  type QueryPreset,
  type QueryPresetMerged,
  type SchemaPreset,
  type SchemaPresetMerged,
  type ValidateConfig,
} from './types';

export function mergeQueryPresets(
  presets: Array<QueryPreset>,
): QueryPresetMerged {
  const emptyPreset: QueryPresetMerged = {
    parser: 'default',
    parserOptions: {},
    extendSchema: [],
    validate: {
      rules: {},
      config: {},
    },
    __overrides: {},
  };

  return presets.reduce((config, preset) => {
    // merge parser
    if (preset.parser) {
      config.parser = preset.parser;
    }

    // merge parserOptions
    if (preset.parserOptions) {
      config.parserOptions = {
        ...config.parserOptions,
        ...preset.parserOptions,
      };
    }

    // merge extendSchema
    if (preset.extendSchema) {
      config.extendSchema.push({
        presetName: preset.name,
        getSchema: preset.extendSchema,
      });
    }

    // merge fragmentScopes
    if (preset.fragmentScopes) {
      config.fragmentScopes = preset.fragmentScopes;
    }

    // merge validateOptions
    if (preset.validate) {
      config.validate = mergeValidateConfig(config.validate, preset.validate);
    }

    if (preset.__overrides) {
      if (!config.__overrides) {
        config.__overrides = {};
      }
      Object.keys(preset.__overrides).forEach(key => {
        if (!config.__overrides[key]) {
          config.__overrides[key] = preset.__overrides[key];
        } else {
          // TODO: warn user that only one preset can define ValidationContext
        }
      });
    }

    return config;
  }, emptyPreset);
}

export function mergeSchemaPresets(
  presets: Array<SchemaPreset>,
): SchemaPresetMerged {
  const emptyPreset: SchemaPresetMerged = {
    parser: 'default',
    parserOptions: {},
    extendSchema: [],
    validate: {
      rules: {},
      config: {},
    },
  };

  return presets.reduce((config, preset) => {
    // merge parser
    if (preset.parser) {
      config.parser = preset.parser;
    }

    // merge extendSchema
    if (preset.extendSchema) {
      config.extendSchema.push({
        presetName: preset.name,
        getSchema: preset.extendSchema,
      });
    }

    // merge parserOptions
    if (preset.parserOptions) {
      config.parserOptions = {
        ...config.parserOptions,
        ...preset.parserOptions,
      };
    }

    // merge validateOptions
    if (preset.validate) {
      config.validate = mergeValidateConfig(config.validate, preset.validate);
    }

    return config;
  }, emptyPreset);
}

function mergeValidateConfig(
  pkgA: ?ValidateConfig,
  pkgB: ?ValidateConfig,
): ValidateConfig {
  return {
    rules: {
      ...(pkgA || {}).rules,
      ...(pkgB || {}).rules,
    },
    config: {
      ...(pkgA || {}).config,
      ...(pkgB || {}).config,
    },
  };
}
