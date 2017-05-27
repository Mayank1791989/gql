/* @flow */
import { replaceTempDir, TEST_TEMP_DIR } from '../src/gql-test-utils/file';
import normalizePath from 'normalize-path';
import stripAnsi from 'strip-ansi';
import hasAnsi from 'has-ansi';

// Snapshot serializer will
// 1) strip ansi from all strings
// 2) normalized strings containing path

module.exports = {
  test: (val: mixed) => {
    return (
      typeof val === 'string' && (hasAnsi(val) || isNotNormalizedPath(val))
    );
  },
  print: (val: string, serialize: Function) => {
    return serialize(normalizePathForSnapshot(stripAnsi(val)));
  },
};

function isNotNormalizedPath(value: string): boolean {
  return value.includes(TEST_TEMP_DIR);
}

function normalizePathForSnapshot(filepath: string): string {
  return normalizePath(replaceTempDir(filepath, '$ROOT_DIR'));
}
