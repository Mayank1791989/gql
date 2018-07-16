/* @flow */
import { TEST_TEMP_DIR } from '../src/gql-test-utils/file';
import normalizePath from 'normalize-path';

module.exports = {
  test: (val: mixed) => isNotNormalizedPathObject(val),
  print: (val: { path: string }, serialize: Function) => {
    return serialize({
      ...val,
      path: normalizePathForSnapshot(val.path),
    });
  },
};

function isNotNormalizedPathObject(value: mixed): boolean {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof value.path === 'string' &&
      value.path.startsWith(TEST_TEMP_DIR),
  );
}

function normalizePathForSnapshot(filepath: string): string {
  return normalizePath(filepath.replace(TEST_TEMP_DIR, '$TEST_TEMP_DIR'));
}
