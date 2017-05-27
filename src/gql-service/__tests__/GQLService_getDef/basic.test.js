/* @flow */
import code from 'gql-test-utils/code';
import path from 'path';
import { createTempFiles } from 'gql-test-utils/file';
import GQLService from '../../GQLService';

describe('Schema', () => {
  it('works in schema files', async () => {
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
      gql.getDef({
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
            "column": 10,
            "line": 8,
          },
          "path": "$ROOT_DIR/schema/schema.gql",
          "start": Object {
            "column": 9,
            "line": 6,
          },
        },
      ]
    `);
  });

  it('should not throw', () => {
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
      gql.getDef({
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
});

describe('Query', () => {
  it('works in query files', async () => {
    const dir = createTempFiles({
      '.gqlconfig': `
        {
          schema: {
            files: 'schema/*.gql',
          },
          query: {
            files: [
              {
                match: 'query/*.gql',
              },
            ]
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
      gql.getDef({
        sourcePath: path.join(dir, 'query/user.gql'),
        ...code(`
          fragment test on Viewer {
              #-------------^
            name
          }
        `),
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "end": Object {
            "column": 10,
            "line": 8,
          },
          "path": "$ROOT_DIR/schema/schema.gql",
          "start": Object {
            "column": 9,
            "line": 6,
          },
        },
      ]
    `);
  });
});
