/* @flow */
import { createTempFiles } from 'gql-test-utils/file';
import GQLService from 'gql-service';
import { dedent } from 'dentist';

test('parser: should report interpolation', async () => {
  const errors = await parseSource(`
    fragment test on Viewer {
      me {
        name
        \${Component.fragment.viewer}
      }
    }
  `);

  expect(errors).toMatchInlineSnapshot(`
Array [
  Object {
    "locations": Array [
      Object {
        "column": 5,
        "line": 4,
        "path": "$ROOT_DIR/query/test.graphql",
      },
    ],
    "message": "Syntax Error: Expected Name, found $",
    "severity": "error",
  },
]
`);
});

async function parseSource(
  source: string,
  opts?: { otherFiles?: { [name: string]: string } } = {},
) {
  const gql = new GQLService({
    configDir: createTempFiles({
      '.gqlconfig': `
        {
          schema: {
            files: 'schema/*.gql',
            validate: {
              config: {
                NoUnusedTypeDefinition: 'off'
              }
            }
          },

          query: {
            files: [
              {
                match: 'query/*.graphql',
                presets: ['apollo-graphql'],
              }
            ]
          }
        }
      `,

      'schema/schema.gql': `
        type Query {
          viewer: Viewer!
        }

        type Viewer {
          me: User!
        }

        type User {
          id: ID!
          name: String
          image(size: Int!): String
        }
      `,

      'query/test.graphql': dedent(source),
      ...opts.otherFiles,
    }),

    watch: false,
  });

  gql.onError(err => {
    throw err;
  });

  await gql.start();

  return gql.status();
}
