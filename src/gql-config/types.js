/* @flow */
/* @babel-flow-runtime-enable */
/* eslint-disable no-use-before-define */
import {
  type IParser,
  type ValidationRule,
  type IValidationContext,
} from 'gql-shared/types';
import { type FragmentScope } from 'gql-shared/FragmentScope';
import { reify, type Type } from 'flow-runtime';
import semver from 'semver';

export type Globs = string | Array<string>;
export type FileMatchConfig = Globs | { include: Globs, ignore?: Globs };
type IQueryContext = any;

type SemverVersion = string;
(reify: Type<SemverVersion>).addConstraint((input: string) => {
  try {
    // eslint-disable-next-line no-new
    new semver.Range(input);
  } catch (err) {
    return 'Not a valid semver version.';
  }

  return null;
});

export type GQLConfigFile = {|
  schema: SchemaConfig,
  query?: {
    files: Array<QueryConfig>,
  },
  version?: SemverVersion,
|};

export type SchemaConfig = {|
  files: FileMatchConfig,
  parser?: ParserPkg,
  validate?: ValidateConfig,
  presets?: Array<PresetPkg>,
  graphQLOptions?: GraphQLOptions,
|};

export type QueryConfig = {|
  match: FileMatchConfig,
  parser?: ParserPkg,
  validate?: ValidateConfig,
  presets?: Array<PresetPkg>,
  fragmentScopes?: Array<FragmentScope>,
|};

export type GQLConfigFileResolved = {|
  schema: SchemaConfigResolved,
  query?: {
    files: Array<QueryConfigResolved>,
  },
  version: ?SemverVersion,
|};

export type SchemaConfigResolved = {|
  files: FileMatchConfig,
  validate: ValidateConfigResolved,
  parser: ParserConfigResolved,
  extendSchema: Array<{ presetName: string, getSchema: () => string }>,
  graphQLOptions?: GraphQLOptions,
|};

export type QueryConfigResolved = {|
  match: FileMatchConfig,
  parser: ParserConfigResolved,
  validate: ValidateConfigResolved,
  extendSchema: Array<{ presetName: string, getSchema: () => string }>,
  fragmentScopes: Array<FragmentScope>,
  QueryContext?: ?IQueryContext,
|};

export type GraphQLOptions = {|
  commentDescriptions?: boolean,
  allowLegacySDLEmptyFields?: boolean,
  allowLegacySDLImplementsInterface?: boolean,
|};

// convert to opaque type
export type ValidateConfig = {
  rules?: { [name: string]: ValidationRule },
  config: ValidateRulesConfig,
};

export type ValidateRulesConfig = {
  [ruleName: string]: 'off' | 'warn' | 'error',
};

export type ValidateConfigResolved = {|
  rules: $ReadOnlyArray<{
    rule: ValidationRule,
    severity: 'warn' | 'error',
    name: string,
  }>,
  ValidationContext?: ?IValidationContext,
|};

type PkgOptions = Object;
type PkgName = string;
export type PkgConfig = PkgName | [PkgName, PkgOptions];

export type PresetPkg = PkgConfig;
export type ParserPkg = PkgConfig;
export type ParserOptions = Object;
export type ParserConfigResolved = [Class<IParser>, ParserOptions];

export type QueryPreset = {
  name: string,
  parser?: ?ParserPkg,
  parserOptions?: Object,
  extendSchema?: ?() => string,
  validate?: ?ValidateConfig,
  fragmentScopes?: Array<FragmentScope>,
  __overrides?: {
    // TODO: validate
    ValidationContext?: IValidationContext,
    QueryContext?: IQueryContext,
  },
};

export type QueryPresetMerged = {|
  parser: ParserPkg,
  parserOptions: Object,
  extendSchema: Array<{ presetName: string, getSchema: () => string }>,
  validate: ValidateConfig,
  fragmentScopes?: Array<FragmentScope>,
  __overrides: {
    ValidationContext?: IValidationContext,
    QueryContext?: IQueryContext,
  },
|};

export type SchemaPreset = {
  name: string,
  parser?: ParserPkg,
  parserOptions?: Object,
  extendSchema?: ?() => string,
  validate?: ?ValidateConfig,
};

export type SchemaPresetMerged = {|
  parser: ParserPkg,
  parserOptions: Object,
  extendSchema: Array<{ presetName: string, getSchema: () => string }>,
  validate: ValidateConfig,
|};

export function validateConfigFile(fileData) {
  const GQLConfigFileType = (reify: Type<GQLConfigFile>);
  return GQLConfigFileType.assert(fileData);
}
