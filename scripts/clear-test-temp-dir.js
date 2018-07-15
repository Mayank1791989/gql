/* @flow */
import fs from 'fs-extra';
import path from 'path';

import { removeTestTempDir } from '../src/gql-test-utils/file';

// remove jest-cache
console.log('Removing jest-cache...');
fs.removeSync(`${path.join(__dirname, '../.tmp/jest-cache')}`);

// remove files generated from test
removeTestTempDir();
