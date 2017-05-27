/* @flow */
import os from 'os';
import fs from 'fs-extra';
import path from 'path';

export const TEST_TEMP_DIR = path.join(
  // NOTE: os.tmpdir doesnt return realpath
  // so causing issues on osx ci server
  fs.realpathSync(os.tmpdir()),
  'gql-test',
);

export function createTempFiles(files: { [file: string]: string }): string {
  // deterministic dirName [as this path used in test cases output (see generated snapshot)]
  const dir = path.join(TEST_TEMP_DIR, `test-${Date.now()}`);

  // @TOOD: should we emptyDirSync?
  // NOTE: ensure directory is empty
  // when tests are run in watch mode we want to make sure files not present from last run
  // fs.emptyDirSync(dir);

  Object.keys(files).forEach(file => {
    const content = files[file];
    fs.outputFileSync(path.join(dir, file), content);
  });
  return dir;
}

export function removeTestTempDir() {
  fs.removeSync(TEST_TEMP_DIR);
}

export function replaceTempDir(filepath: string, str: string): string {
  return path.relative(TEST_TEMP_DIR, filepath).replace(/test-\d+/u, str);
}
