/* @flow */
/* eslint-disable max-len */
import GQLService from '../../GQLService';
import { createTempFiles } from 'gql-test-utils/file';

test('report query errors', async () => {
  const gql = new GQLService({
    configDir: createTempFiles({
      '.gqlconfig': `
        {
          schema: {
            files: 'schema/*.gql',
          },
          query: {
            files: [
              {
                match: 'query/*.gql',
              }
            ]
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
      'query/query.gql': `
        query Test {
          xViewer {
            name
          }
        }
      `,
    }),
    watch: false,
  });

  gql.onError(err => {
    throw err;
  });

  await gql.start();

  expect(gql.status()).toMatchInlineSnapshot(`
    Array [
      Object {
        "locations": Array [
          Object {
            "column": 11,
            "line": 3,
            "path": "$ROOT_DIR/query/query.gql",
          },
        ],
        "message": "Cannot query field \\"xViewer\\" on type \\"Query\\". Did you mean \\"viewer\\"? (FieldsOnCorrectType)",
        "severity": "error",
      },
    ]
  `);
});
