/* @flow */
import { createTempFiles } from 'gql-test-utils/file';
import GQLService from 'gql-service';
import { dedent } from 'dentist';

async function parseSource(source: string): Promise<any> {
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
                presets: ['relay']
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
    }),

    watch: false,
  });
  gql.onError(err => {
    throw err;
  });
  await gql.start();

  return gql.status();
}

test('parser: allow fragments without name', async () => {
  const errors = await parseSource(`
    Relay.QL\`
      fragment on Viewer {
        me { name }
      }
    \`
  `);

  expect(errors).toMatchSnapshot();
});

test('parser: allow fragment interpolation', async () => {
  const errors = await parseSource(`
    Relay.QL\`
      fragment on Viewer {
        me {
          name
          \${Component.getFragment('viewer')}
        }
      }
    \`
  `);

  expect(errors).toMatchSnapshot();
});

test('parser: only allow interpolation inside fragments', async () => {
  const errors = await parseSource(`
    Relay.QL\`
      fragment on Viewer {
        me {
          name
        }
      }
      \${relay_doesnt_support_interpolation_here}
    \`
  `);

  expect(errors).toMatchSnapshot();
});
