/* @flow */
module.exports = {
  extends: [
    'eslint-config-airbnb-base/rules/best-practices',
    'eslint-config-airbnb-base/rules/errors',
    'eslint-config-airbnb-base/rules/node',
    'eslint-config-airbnb-base/rules/style',
    'eslint-config-airbnb-base/rules/variables',
    'eslint-config-airbnb-base/rules/es6',
  ].map(require.resolve),

  parser: require.resolve('babel-eslint'),

  globals: {
    describe: false,
    beforeEach: false,
    jest: false,
    it: false,
    expect: false,
    test: false,

    // flow
    $Exact: false,
    $Keys: false,
  },

  rules: {
    'no-param-reassign': ['error', { 'props': false }],
    'no-underscore-dangle': 'off',
    'global-require': 'off',
  },
};
