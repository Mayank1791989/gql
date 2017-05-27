/* @flow */
import { createTempFiles } from 'gql-test-utils/file';
import GQLService from 'gql-service';
import { dedent } from 'dentist';

async function status(source: string, options?: Object): Promise<any> {
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
              presets: [
                ['relay-modern', ${JSON.stringify(options || {})}],
              ]
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
  });

  const gql = new GQLService({
    configDir: rootPath,
    watch: false,
  });
  gql.onError(err => {
    throw err;
  });

  await gql.start();
  return gql.status();
}

test('graphql tag is valid', async () => {
  const errors = await status(
    `
      const a = graphql\`
        fragment user on xUser {
          name
        }
      \`
    `,
  );

  expect(errors).toMatchSnapshot();
});

test('graphql.experimental tag is valid', async () => {
  const errors = await status(
    `
      const a = graphql.experimental\`
        # NOTE intentionally using xUser.
        # is tag is valid then validation rule error will come
        fragment user on xUser {
          name
        }
      \`
    `,
  );

  expect(errors).toMatchSnapshot();
});

test('Relay.QL tag valid if classic mode enabled', async () => {
  const errors = await status(
    `
      const a = Relay.QL\`
        fragment user on xUser {
          name
        }
      \`
    `,
    { classic: true },
  );

  expect(errors).toMatchSnapshot();
});

test('Relay.QL tag should not work if classic mode disabled', async () => {
  const errors = await status(
    `
      const a = Relay.QL\`
        fragment user on xUser {
          name
        }
      \`
    `,
    { classic: false },
  );

  expect(errors).toEqual([]);
});
