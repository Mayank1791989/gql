/* @flow */
/* @babel-flow-runtime-enable */
import {
  type ValidateConfig,
  type ValidateConfigResolved,
} from 'gql-shared/GQLValidate/types';
import { type IResolverParser } from './language/parser';
import {
  type TypeSchemaResolverValidationRule,
  type TypeLocalResolverValidationRule,
  type TypeGlobalResolverValidationRule,
  type ResolverValidationRule,
} from './validation/types';
import { type FileMatchConfig, type PkgConfig } from 'gql-config/types';

export type ResolverValidationConfig = ValidateConfig<ResolverValidationRule>;

export type ResolverValidateConfigResolved = {|
  schema: ValidateConfigResolved<TypeSchemaResolverValidationRule>,
  local: ValidateConfigResolved<TypeLocalResolverValidationRule>,
  global: ValidateConfigResolved<TypeGlobalResolverValidationRule>,
|};

export type ResolverParserLoadedPkg = {
  create(): IResolverParser,
};

export type ResolverPluginOptions = {|
  files: FileMatchConfig,
  parser: PkgConfig,
  validate?: ResolverValidationConfig,
|};

export type ResolverPluginOptionsResolved = {|
  files: FileMatchConfig,
  parser: ResolverParserLoadedPkg,
  validate: ResolverValidateConfigResolved,
|};
