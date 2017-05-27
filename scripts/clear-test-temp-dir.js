/* @flow */
import { execSync } from 'child_process';
import path from 'path';

import { removeTestTempDir } from '../src/gql-test-utils/file';

// remove jest-cache
console.log('Removing jest-cache...');
execSync(`rm -rf ${path.join(__dirname, '../.tmp/jest-cache')}`);

// remove files generated from test
removeTestTempDir();
