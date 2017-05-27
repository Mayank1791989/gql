/* @flow */
import { createTempFiles } from 'gql-test-utils/file';
import GQLService from 'gql-service';
import { dedent } from 'dentist';

async function parseSource(
  source: string,
  opts?: { otherFiles?: Object } = {},
): Promise<any> {
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
                match: 'query/*.js',
                presets: ['apollo'],
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

      'query/test.js': dedent(source),
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

test('parser: allow interpolation document level', async () => {
  const errors = await parseSource(
    `
    gql\`
      fragment test on Viewer {
        me {
          name
          ...HeaderUser
        }
      }
      \${Header.fragments.user}
    \`
  `,
    {
      otherFiles: {
        'query/Component.js': `
          Component.fragments = {
            user: gql\`
              fragment HeaderUser on User {
                id
              }
            \`
          }
        `,
      },
    },
  );

  expect(errors).toEqual([]);
});

test('parser: should not allow interpolation inside fragments', async () => {
  const errors = await parseSource(`
    gql\`
      fragment test on Viewer {
        me {
          name
          \${Component.fragment.viewer}
        }
      }
    \`
  `);

  expect(errors).toMatchSnapshot();
});

test('parser: should report error if fragment name missing', async () => {
  const errors = await parseSource(`
    gql\`
      fragment on Viewer {
        me { name }
      }
    \`
  `);

  expect(errors).toMatchSnapshot();
});
