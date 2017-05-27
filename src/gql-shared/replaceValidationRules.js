/* @flow */
import { type ValidationRule } from './types';

export default function replaceValidationRules(
  allRules: Array<ValidationRule>,
  rulesToReplace: Array<ValidationRule>,
): $ReadOnlyArray<ValidationRule> {
  const rulesToReplaceMap: {
    [name: string]: ValidationRule,
  } = rulesToReplace.reduce((acc, rule) => {
    acc[rule.name] = rule;
    return acc;
  }, {});

  return allRules.map(rule => rulesToReplaceMap[rule.name] || rule);
}
