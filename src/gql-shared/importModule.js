/* @flow */
export default function importModule(
  moduleID: string,
  dir: string | $ReadOnlyArray<string>,
): mixed {
  const dirs = toArray(dir);

  for (let i = 0; i < dirs.length; i += 1) {
    try {
      // NOTE: using require instead of import from to support doMock in test cases
      // see mockImportModule in gql-test-utils
      const m = require('import-from')(dirs[i], moduleID);
      return interopRequireDefault(m).default;
    } catch (err) {
      if (err.code !== 'MODULE_NOT_FOUND') {
        throw err;
      }
    }
  }

  throw new Error(`module '${moduleID}' not found relative to ${toMsg(dirs)}`);
}

// To support both 'module.exports' and 'export default'
function interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function toMsg(dirs: $ReadOnlyArray<string>): string {
  return dirs.length === 1 ? dirs[0] : `[${dirs.join(', ')}]`;
}

function toArray(val: string | $ReadOnlyArray<string>): $ReadOnlyArray<string> {
  return Array.isArray(val) ? val : [val];
}
