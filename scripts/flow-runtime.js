/**
 * wrapper to babel-plugin-flow-runtime to run
 * flow-runtime only on files which contains
 * pragma @flow-runtime
 */
var babelFlowRuntime = require('babel-plugin-flow-runtime').default;

function isFlowRuntimeEnabled(node) {
  if (node.type !== 'Program') {
    console.log('node should be of type Program');
    return false;
  }

  const comments = node.body[0]
    ? node.body[0].leadingComments || node.body[0].comments
    : node.innerComments || node.leadingComments || node.comments;

  if (!comments) {
    return false;
  }

  // prettier-ignore
  return Boolean(
    comments.find(comment => /@babel-flow-runtime-enable/.test(comment.value))
  );
}

module.exports = config => {
  var plugin = babelFlowRuntime(config);
  return {
    visitor: {
      Program(path, state) {
        if (!isFlowRuntimeEnabled(path.node)) {
          return;
        }
        // run flow-runtime
        plugin.visitor.Program(path, state);
      },
    },
  };
};
