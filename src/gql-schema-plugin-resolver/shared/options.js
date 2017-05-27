/* @flow */
/* @babel-flow-runtime-enable */
import {
  type ResolverPluginOptions,
  type ResolverPluginOptionsResolved,
  type ResolverParserLoadedPkg,
  type ResolverValidateConfigResolved,
} from './types';
import { resolveValidateConfig } from 'gql-shared/GQLValidate';
import { type ResolverValidationRule } from './validation/types';
import { PkgUtils } from 'gql-config';
import rules from './validation/rules';

import { reify, type Type } from 'flow-runtime';

export function resolveOptions(
  options: ResolverPluginOptions,
  pkgUtils: PkgUtils,
): ResolverPluginOptionsResolved {
  return {
    files: options.files,
    parser: pkgUtils.load({
      prefix: 'gql-resolver-parser',
      pkgConfig: options.parser,
      corePkgs: [],
      extraPkgOptions: null,
      validate(parserModule): ResolverParserLoadedPkg {
        // const ParserType = (reify: Type<ResolverParserLoadedPkg>);
        // ParserType.assert(parserModule);
        return (parserModule: $FixMe);
      },
    }),
    validate: resolveValidate({
      rules,
      config: {
        ...Object.keys(rules).reduce((acc, rule) => {
          acc[rule] = 'error';
          return acc;
        }, {}),
        ...(options.validate ? options.validate.config : {}),
      },
    }),
  };
}

function resolveValidate(options): ResolverValidateConfigResolved {
  const resolvedConfig = resolveValidateConfig<ResolverValidationRule>(options);
  const schemaRules = [];
  const localRules = [];
  const globalRules = [];

  resolvedConfig.rules.forEach(({ rule, ...other }) => {
    if (rule.type === 'Schema') {
      schemaRules.push({
        ...other,
        rule,
      });
      return;
    }

    if (!rule.type || rule.type === 'Resolver') {
      if (rule.isGlobal) {
        globalRules.push({ rule, ...other });
        return;
      }
      localRules.push({ rule, ...other });
    }
  });

  return {
    schema: { rules: schemaRules },
    local: { rules: localRules },
    global: { rules: globalRules },
  };
}

export function validateOptions(val: mixed): ResolverPluginOptions {
  const PluginPkgOptionsType = (reify: Type<ResolverPluginOptions>);
  PluginPkgOptionsType.assert(val);
  return (val: $FixMe);
}
