/* @flow */
import { type DocumentNode } from 'graphql';
import ValidationTypeInfo from './ValidationTypeInfo';

export type ValidateRulesConfig = {
  [ruleName: string]:
    | ('off' | 'warn' | 'error')
    | ['off' | 'warn' | 'error', mixed /* options */],
};

export type ValidateConfig<TValidationRule> = {
  rules?: { [name: string]: (options: mixed) => TValidationRule },
  config: ValidateRulesConfig,
};

export type ValidateConfigResolved<TValidationRule> = {|
  rules: $ReadOnlyArray<{|
    +name: string,
    +rule: TValidationRule,
    +severity: 'warn' | 'error',
  |}>,
  ValidationContext?: ?$FixMe,
|};

export type ValidationRules<TValidationRule> = {
  config: ValidateConfigResolved<TValidationRule>,
  createContext: (ast: DocumentNode, typeInfo: ValidationTypeInfo) => $FixMe,
};
