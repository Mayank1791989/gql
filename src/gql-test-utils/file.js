/* @flow */
import os from 'os';
import objectHash from 'object-hash';
import fs from 'fs-extra';
import path from 'path';

export const TEST_TEMP_DIR = path.join(os.tmpdir(), 'gql-test');

export function createTempFiles(files: { [file: string]: string }): string {
  // deterministic dirName [as this path used in test cases output (see generated snapshot)]
  const dir = path.join(TEST_TEMP_DIR, objectHash(files));
  Object.keys(files).forEach(file => {
    const content = files[file];
    fs.outputFileSync(path.join(dir, file), content);
  });
  return dir;
}

export function removeTestTempDir() {
  fs.removeSync(TEST_TEMP_DIR);
}
