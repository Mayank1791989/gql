/* @flow */
import { createTempFiles } from 'gql-test-utils/file';
import { runCLICommand } from './test-utils';

test('cli check command', async () => {
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
});
