/* @flow */
type Rule = any;
const replaceRules = (allRules: Array<Rule>, rulesToReplace: Array<Rule>) => {
  const map = rulesToReplace.reduce((acc, rule) => {
    acc[rule.name] = rule;
    return acc;
  }, {});

  return allRules.map((rule) => map[rule.name] || rule);
};

export default replaceRules;
