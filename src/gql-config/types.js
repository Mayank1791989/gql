/* @flow */
/* @babel-flow-runtime-enable */
/* eslint-disable no-use-before-define */
import {
  type IQueryParser,
  type ISchemaParser,
  type IValidationContext,
  type SchemaPluginParams,
  type ISchemaPlugin,
} from 'gql-shared/types';
import { type FragmentScope } from 'gql-shared/FragmentScope';
import {
  type ValidateConfig,
  type ValidateConfigResolved,
} from 'gql-shared/GQLValidate/types';
import { type ASTVisitor } from 'graphql';
import { reify, type Type } from 'flow-runtime';
import semver from 'semver';

export type Globs = string | Array<string>;
export type FileMatchConfig = Globs | { include: Globs, ignore?: Globs };
type IQueryContext = any;

export type SemverVersion = string;
(reify: Type<SemverVersion>).addConstraint((input: string) => {
  try {
    // eslint-disable-next-line no-new
    new semver.Range(input);
  } catch (err) {
    return 'Not a valid semver version.';
  }

  return null;
});

type SchemaValidationRule = { +create: (context: $FixMe) => ASTVisitor };
type QueryValidationRule = { +create: (context: $FixMe) => ASTVisitor };

export type GQLConfigFile = {|
  schema: SchemaConfig,
  query?: {
    files: Array<QueryConfig>,
  },
  version?: SemverVersion,
  options?: OptionsConfig,
|};

export type SchemaConfig = {|
  files: FileMatchConfig,
  parser?: PkgConfig,
  validate?: ValidateConfig<SchemaValidationRule>,
  presets?: Array<PkgConfig>,
  graphQLOptions?: GraphQLOptions,
  plugins: $ReadOnlyArray<PkgConfig>,
|};

export type QueryConfig = {|
  match: FileMatchConfig,
  parser?: PkgConfig,
  validate?: ValidateConfig<QueryValidationRule>,
  presets?: Array<PkgConfig>,
  fragmentScopes?: Array<FragmentScope>,
|};

export type OptionsConfig = {|
  modulePaths?: $ReadOnlyArray<string>,
|};

export type GQLConfigFileResolved = {|
  schema: SchemaConfigResolved,
  query?: {
    files: $ReadOnlyArray<QueryConfigResolved>,
  },
  version: ?SemverVersion,
  options: OptionsConfigResolved,
|};

export type SchemaConfigResolved = {|
  files: FileMatchConfig,
  validate: ValidateConfigResolved<SchemaValidationRule>,
  parser: SchemaParserLoadedPkg,
  extendSchema: Array<{ presetName: string, getSchema: () => string }>,
  graphQLOptions?: GraphQLOptions,
  plugins: $ReadOnlyArray<SchemaPluginLoadedPkg>,
|};

export type QueryConfigResolved = {|
  match: FileMatchConfig,
  parser: QueryParserLoadedPkg,
  validate: ValidateConfigResolved<QueryValidationRule>,
  extendSchema: Array<{ presetName: string, getSchema: () => string }>,
  fragmentScopes: Array<FragmentScope>,
  QueryContext?: ?IQueryContext,
|};

export type OptionsConfigResolved = {|
  modulePaths: $ReadOnlyArray<string>,
|};

export type GraphQLOptions = {|
  commentDescriptions?: boolean,
  allowLegacySDLEmptyFields?: boolean,
  allowLegacySDLImplementsInterfaces?: boolean,
|};

type PkgOptions = Object;
type PkgName = string;
export type PkgConfig = PkgName | [PkgName, PkgOptions];

export type SchemaParserLoadedPkg = {
  create(): ISchemaParser,
};
export type QueryParserLoadedPkg = {
  create(): IQueryParser,
};
export type SchemaPluginLoadedPkg = {
  create(params: SchemaPluginParams): ISchemaPlugin,
};

export type QueryPreset = {
  parser?: ?PkgConfig,
  parserOptions?: Object,
  extendSchema?: ?() => string,
  validate?: ?ValidateConfig<QueryValidationRule>,
  fragmentScopes?: Array<FragmentScope>,
  __overrides?: {
    // TODO: validate
    ValidationContext?: IValidationContext,
    QueryContext?: IQueryContext,
  },
};

export type QueryPresetMerged = {|
  parser: PkgConfig,
  parserOptions: Object,
  extendSchema: Array<{ presetName: string, getSchema: () => string }>,
  validate: ValidateConfig<QueryValidationRule>,
  fragmentScopes?: Array<FragmentScope>,
  __overrides: {
    ValidationContext?: IValidationContext,
    QueryContext?: IQueryContext,
  },
|};

export type SchemaPreset = {
  parser?: PkgConfig,
  parserOptions?: Object,
  extendSchema?: ?() => string,
  validate?: ?ValidateConfig<SchemaValidationRule>,
};

export type SchemaPresetMerged = {|
  parser: PkgConfig,
  parserOptions: Object,
  extendSchema: Array<{ presetName: string, getSchema: () => string }>,
  validate: ValidateConfig<SchemaValidationRule>,
|};

export function validateConfigFile(fileData: any): GQLConfigFile {
  const GQLConfigFileType = (reify: Type<GQLConfigFile>);
  GQLConfigFileType.assert(fileData);
  return fileData;
}
