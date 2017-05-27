/* @flow */
import { type ValidationRule } from './types';

export default function replaceValidationRules(
  allRules: Array<ValidationRule>,
  rulesToReplace: Array<ValidationRule>,
) {
  const map = rulesToReplace.reduce((acc, rule) => {
    acc[rule.name] = rule;
    return acc;
  }, {});

  return allRules.map(rule => map[rule.name] || rule);
}
