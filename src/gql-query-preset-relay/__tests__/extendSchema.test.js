/* @flow */
import { createTempFiles } from 'gql-test-utils/file';
import code from 'gql-test-utils/code';
import GQLService from 'gql-service';
import path from 'path';

test('autocomplete should include relay custom directives', async () => {
  const rootPath = createTempFiles({
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
  });

  const gql = new GQLService({
    configDir: rootPath,
    watch: false,
  });

  gql.onError(err => {
    throw err;
  });

  await gql.start();

  expect(
    gql.autocomplete({
      sourcePath: path.join(rootPath, 'query/user.js'),
      ...code(`
        Relay.QL\`
          fragment test on Viewer @  ##
              #  ------------------^
        \`
      `),
    }),
  ).toMatchSnapshot();
});
