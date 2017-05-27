/* @flow */
import { type PkgConfig, type SchemaPluginLoadedPkg } from './types';
import PkgUtils from './PkgUtils';

import { reify, Type } from 'flow-runtime';

export function loadSchemaPlugins(
  plugins: ?$ReadOnlyArray<PkgConfig>,
  pkgUtils: PkgUtils,
): $ReadOnlyArray<SchemaPluginLoadedPkg> {
  return (plugins || []).map(schemaPluginPkg => {
    return pkgUtils.load<SchemaPluginLoadedPkg>({
      prefix: 'gql-schema-plugin',
      pkgConfig: schemaPluginPkg,
      corePkgs: ['gql-schema-plugin-resolver'],
      extraPkgOptions: null,
      validate(plugin): SchemaPluginLoadedPkg {
        // const SchemaPluginLoadedPkgType = (reify: Type<SchemaPluginLoadedPkg>);
        // SchemaPluginLoadedPkgType.assert(plugin);
        return (plugin: $FixMe);
      },
    });
  });
}
