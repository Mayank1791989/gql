/* @flow */
import { PkgUtils } from 'gql-config';
import GQLResolverPlugin from './GQLResolverPlugin';
import { type SchemaPluginParams, ISchemaPlugin } from 'gql-shared/types';
import { validateOptions, resolveOptions } from './shared/options';
import { type ResolverParserLoadedPkg } from './shared/types';

export default function pluginResolverPkg(options: mixed, pkgUtils: PkgUtils) {
  const pluginOptions = validateOptions(options);
  const pluginOptionsResolved = resolveOptions(pluginOptions, pkgUtils);
  return {
    create(params: SchemaPluginParams): ISchemaPlugin {
      return new GQLResolverPlugin(pluginOptionsResolved, params);
    },
  };
}

export type { ResolverParserLoadedPkg };
