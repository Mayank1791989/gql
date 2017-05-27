/* @flow */
import code from 'gql-test-utils/code';
import path from 'path';
import { createTempFiles } from 'gql-test-utils/file';
import GQLService from '../../GQLService';

test('works in schema files', async () => {
  const dir = createTempFiles({
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
        name: string
      }
    `,
  });

  const gql = new GQLService({
    configDir: dir,
    watch: false,
  });

  gql.onError(err => {
    throw err;
  });

  await gql.start();

  expect(
    gql.getInfo({
      sourcePath: path.join(dir, 'schema/user.gql'),
      ...code(`
        type User {
          viewer: Viewer
          #---------^
        }
      `),
    }),
  ).toMatchInlineSnapshot(`
    Array [
      Object {
        "contents": Array [
          "type Viewer {
            name: string
          }",
        ],
      },
    ]
  `);
});

test('should not throw if called before onInit', () => {
  const dir = createTempFiles({
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
        name: string
      }
    `,
  });

  const gql = new GQLService({
    configDir: dir,
    watch: false,
  });

  gql.onError(err => {
    throw err;
  });

  const run = () =>
    gql.getInfo({
      sourcePath: path.join(dir, 'schema/user.gql'),
      ...code(`
        type User {
          viewer: Viewer
          #---------^
        }
      `),
    });

  expect(run).not.toThrow();
  expect(run()).toEqual([]);
});
