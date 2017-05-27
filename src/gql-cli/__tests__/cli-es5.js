/* @flow */
const path = require('path');

require('babel-register')({
  presets: [['playlyfe', { react: false, asyncAwait: true }]],
  plugins: [['module-resolver', { root: [path.resolve(__dirname, '../../')] }]],
});

require('../cli');
