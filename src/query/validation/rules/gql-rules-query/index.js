/* @flow */
import { specifiedRules } from 'graphql/validation/specifiedRules';
import replaceRules from '../_shared/replaceRules';

// modified rules
import { ArgumentsOfCorrectType } from './ArgumentsOfCorrectType';

export default {
  rules: replaceRules(specifiedRules, [ArgumentsOfCorrectType]),
  config: specifiedRules.reduce((acc, rule) => {
    acc[rule.name] = 'error';
    return acc;
  }, {}),
};

