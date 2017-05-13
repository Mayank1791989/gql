/* @flow */
module.exports = {
  plugins: [
    "playlyfe",
  ],

  extends: [
    "plugin:playlyfe/js",
    "plugin:playlyfe/flow",
    "plugin:playlyfe/testing:jest",
  ],

  env: {
    node: true,
  },
};
