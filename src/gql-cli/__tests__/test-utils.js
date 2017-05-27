/* @flow */

import { exec } from 'child_process';
const CLI_PATH = require.resolve('./cli-es5.js');

export function runCLICommand(
  command: string,
  options: { cwd: string },
): Promise<{ err: ?{ code: number }, stdout: string, stderr: string }> {
  return new Promise(resolve => {
    exec(
      `node ${CLI_PATH} check`,
      {
        encoding: 'utf8',
        ...options,
      },
      (err, _stdout, _stderr) => {
        const stdout: string = (_stdout: any);
        const stderr: string = (_stderr: any);
        resolve({ err, stdout, stderr });
      },
    );
  });
}
