/* @flow */
/* @babel-flow-runtime-enable */
import { validateFragmentScopes } from 'gql-shared/FragmentScope';
import { type QueryPreset, type SchemaPreset, type PkgConfig } from './types';
import PkgUtils from './PkgUtils';

import { reify, Type } from 'flow-runtime';

export function loadQueryPresets(
  presets: ?$ReadOnlyArray<PkgConfig>,
  pkgUtils: PkgUtils,
): Array<{ name: string, preset: QueryPreset }> {
  return (presets || ['default']).map(presetPkg => {
    return {
      name: presetPkg,
      preset: pkgUtils.load({
        pkgConfig: presetPkg,
        prefix: 'gql-query-preset',
        extraPkgOptions: null,
        corePkgs: [
          'gql-query-preset-relay',
          'gql-query-preset-relay-modern',
          'gql-query-preset-apollo',
          'gql-query-preset-apollo-graphql',
          'gql-query-preset-default',
        ],
        validate(presetConfig): QueryPreset {
          const QueryPresetType = (reify: Type<QueryPreset>);
          // validate type
          QueryPresetType.assert(presetConfig);

          // validate fragmentScopes if present
          if (presetConfig.fragmentScopes) {
            const error = validateFragmentScopes(presetConfig.fragmentScopes);
            if (error) {
              throw error;
            }
          }

          return (presetConfig: $FixMe);
        },
      }),
    };
  });
}

export function loadSchemaPresets(
  presets: ?Array<PkgConfig>,
  pkgUtils: PkgUtils,
): Array<{ name: string, preset: SchemaPreset }> {
  return (presets || ['default']).map(presetPkg => {
    return {
      name: presetPkg,
      preset: pkgUtils.load({
        prefix: 'gql-schema-preset',
        pkgConfig: presetPkg,
        corePkgs: ['gql-schema-preset-default'],
        extraPkgOptions: null,
        validate(preset): SchemaPreset {
          const SchemaPresetType = (reify: Type<SchemaPreset>);
          SchemaPresetType.assert(preset);
          return (preset: $FixMe);
        },
      }),
    };
  });
}

// function loadPreset<TPreset: QueryPreset | SchemaPreset>(params: {
//   preset: PresetPkg,
//   prefix: string,
//   validate: (preset: any) => TPreset,
//   corePresets: Array<string>,
//   configDir: string,
// }): { name: string, preset: TPreset } {
//   const [presetPkg, options] = normalizePkgConfig(params.prefix, params.preset);

//   const [pkg, dir] = params.corePresets.includes(presetPkg)
//     ? [`./${presetPkg}`, GQL_MODULE_DIR]
//     : [presetPkg, params.configDir];

//   try {
//     const presetModule = importModule(pkg, dir);

//     if (typeof presetModule !== 'function') {
//       throw new Error(
//         `PRESET_PKG_INVALID: expected preset "${presetPkg}" to export "function" but found "${typeof presetModule}"`,
//       );
//     }

//     const presetConfig = presetModule(options);

//     return { name: pkg, preset: params.validate(presetConfig) };
//   } catch (err) {
//     if (err.code === 'MODULE_NOT_FOUND') {
//       throw new Error(
//         `PRESET_PKG_NOT_FOUND: Preset '${pkg}' not found relative to '${dir}'`,
//       );
//     }

//     if (err.name === 'RuntimeTypeError') {
//       throw new Error(
//         `PRESET_CONFIG_INVALID: There are errors in preset '${pkg}'\n\n${
//           err.message
//         }`,
//       );
//     }

//     throw err;
//   }
// }
