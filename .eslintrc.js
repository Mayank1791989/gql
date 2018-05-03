/* @flow */
module.exports = {
  plugins: ['playlyfe'],

  extends: [
    'plugin:playlyfe/js',
    'plugin:playlyfe/flowtype',
    'plugin:playlyfe/testing:jest',
    'plugin:playlyfe/prettier',
  ],

  env: {
    node: true,
  },

  rules: {
    'arrow-paren': 'off',
    'no-negated-condition': 'off',
    'arrow-body-style': 'off',
    complexity: 'off',
    'no-restricted-properties': 'warn',
  },
};
