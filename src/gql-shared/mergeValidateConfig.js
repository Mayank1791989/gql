/* @flow */
import { type ValidationRulesPackage, type ValidationConfig } from './types';

export default function mergeValidateConfig(
  validatePkg: ValidationRulesPackage,
  overrideConfig?: ValidationConfig,
) {
  return {
    rules: validatePkg.rules,
    config: {
      ...validatePkg.config,
      ...(overrideConfig || {}).rules,
    },
  };
}
