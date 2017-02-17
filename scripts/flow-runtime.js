/**
 * Hack: to enable flow-runtime plugin only for GQLConfig.
 * babel-flow-runtime fails a lot so enabling only for GQLConfig for now
 * NOTE: GQLConfig validation is done using flow runtime
 */
var babelFlowRuntime = require('babel-plugin-flow-runtime').default;

module.exports = (config) => {
  var plugin = babelFlowRuntime(config);
  return {
    visitor: {
      Program(path, state) {
        var filename = state.file.opts.filename;
        if (filename.match("GQLConfig")) {
          plugin.visitor.Program(path, state);
        }
      }
    }
  };
};
