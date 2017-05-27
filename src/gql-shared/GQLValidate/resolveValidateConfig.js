/* @flow */
import { type ValidateConfig, type ValidateConfigResolved } from './types';

export default function resolveValidateConfig<TValidationRule>(
  validateConfig: ?ValidateConfig<TValidationRule>,
  ValidationContext?: ?IValidationContext,
): ValidateConfigResolved<TValidationRule> {
  if (!validateConfig) {
    return {
      rules: [],
    };
  }

  const { rules, config } = validateConfig;
  const resolvedConfig: ValidateConfigResolved<TValidationRule> = {
    rules: rules
      ? Object.keys(rules).reduce((acc, ruleName) => {
          const rule = rules[ruleName];
          const ruleConfig = getRuleConfig(config, ruleName);
          if (ruleConfig && ruleConfig.severity !== 'off') {
            acc.push({
              name: ruleName,
              severity: ruleConfig.severity,
              rule: rule(ruleConfig.options),
            });
          }
          return acc;
        }, [])
      : [],
  };

  if (ValidationContext) {
    resolvedConfig.ValidationContext = ValidationContext;
  }

  return resolvedConfig;
}

function getRuleConfig(
  config,
  ruleName: string,
): null | { severity: 'off' | 'error' | 'warn', options: mixed } {
  const ruleConfig = config[ruleName];
  if (!ruleConfig) {
    return null;
  }
  const [severity, options] = Array.isArray(ruleConfig)
    ? ruleConfig
    : [ruleConfig, null];

  return { severity, options };
}
