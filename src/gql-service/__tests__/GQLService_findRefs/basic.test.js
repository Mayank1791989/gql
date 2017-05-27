/* @flow */
import code from 'gql-test-utils/code';
import path from 'path';
import { createTempFiles } from 'gql-test-utils/file';
import GQLService from '../../GQLService';

test('findRefs should return all references of token at given position', async () => {
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
    gql.findRefs({
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
        "end": Object {
          "column": 8,
          "line": 8,
        },
        "path": "$ROOT_DIR/schema/schema.gql",
        "start": Object {
          "column": 7,
          "line": 6,
        },
      },
      Object {
        "end": Object {
          "column": 23,
          "line": 3,
        },
        "path": "$ROOT_DIR/schema/schema.gql",
        "start": Object {
          "column": 17,
          "line": 3,
        },
      },
    ]
  `);
});

test('should not throw if called before starting server', () => {
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
    gql.findRefs({
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
