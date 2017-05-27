/* @flow */
import path from 'path';
import code from 'gql-test-utils/code';
import GQLService from '../../GQLService';
import { createTempFiles } from 'gql-test-utils/file';
import { sortHints } from 'gql-test-utils/test-data';

test('works in schema files', async () => {
  const rootPath = createTempFiles({
    '.gqlconfig': `
      {
        schema: {
          files: 'schema/*.gql',
        }
      }
    `,
    'schema/schema.gql': `
      type Query {
        viewer: Viewer
      }

      type Viewer {
        name: String
      }
    `,
  });

  const gql = new GQLService({
    configDir: rootPath,
    watch: false,
  });
  gql.onError(err => {
    throw err;
  });

  await gql.start();

  const hints = sortHints(
    gql.autocomplete({
      sourcePath: path.join(rootPath, 'schema/user.gql'),
      ...code(`
        type User {
          viewer: Vi
          #---------^
        }
    `),
    }),
  );
  expect(hints).toMatchSnapshot();
});

test('should not throw if called before server started', () => {
  const gql = new GQLService({
    configDir: createTempFiles({
      '.gqlconfig': `
        {
          schema: {
            files: 'schema/*.gql',
          }
        }
      `,
      'schema/schema.gql': `
        type Query {
          viewer: Viewer
        }

        type Viewer {
          name: String
        }
      `,
    }),
    watch: false,
  });

  const run = () =>
    gql.autocomplete({
      sourcePath: 'schema/user.gql',
      ...code(`
      type User {
        viewer: Vi
        #---------^
      }
    `),
    });

  expect(run).not.toThrow();
  expect(run()).toEqual([]);
});
