/* @flow */
import { createTempFiles } from 'gql-test-utils/file';
import { runCLICommand } from './test-utils';

test(
  'cli check command',
  async () => {
    const rootPath = createTempFiles({
      '.gqlconfig': `
      {
        schema: {
          files: 'schema/*.gql',
        }
      }
    `,

      'schema/schema.gql': `
      type Querys {
        viewer: Viewer
      }

      type Viewer {
        name: String
      }
    `,
    });

    const { err, stdout, stderr } = await runCLICommand('check', {
      cwd: rootPath,
    });

    expect({
      code: err ? err.code : null,
      stdout,
      stderr,
    }).toMatchSnapshot();
  },
  // on ci server most of the time this test is timing out
  // so increasing default jest timeout from 5 to 20 sec
  20 * 1000,
);
