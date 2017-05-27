/* @flow */
// import parseQuery from '../parseQuery';
import { createTempFiles } from 'gql-test-utils/file';
import { dedent } from 'dentist';
import GQLService from 'gql-service';

async function validateSource(
  source: string,
  opts: {| presetOptions?: Object, otherFiles?: Object |} = {},
): Promise<any> {
  const gql = new GQLService({
    configDir: createTempFiles({
      '.gqlconfig': JSON.stringify({
        schema: {
          files: 'schema/*.gql',
          validate: {
            config: {
              NoUnusedTypeDefinition: 'off',
            },
          },
        },

        query: {
          files: [
            {
              match: 'query/*.js',
              presets: [['apollo', opts.presetOptions || {}]],
            },
          ],
        },
      }),

      'schema/schema.gql': `
        type Query {
          viewer: Viewer!
          mutation: Mutation!
          users(
            #The number of items to skip, for pagination
            offset: Int

            #The number of items to fetch starting from the offset, for pagination
            limit: Int
          ): [User]
        }

        type Viewer {
          me: User!
          id: ID!
        }

        type User {
          id: ID!
          name: String
          image(size: Int!): String
        }

        type Mutation {
          UserCreate(input: UserCreateInput): UserCreatePayload
        }

        input UserCreateInput {
          id: ID!
          name: String!
        }

        type UserCreatePayload {
          userID: ID!
          viewer: Viewer!
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

describe('Rule: KnownFragmentNames', () => {
  it('report missing fragments', async () => {
    const errors = await validateSource(
      `
        gql\`
          fragment Test on User {
            ...SomeUnknownFragment
          }
        \`
      `,
    );
    expect(errors).toMatchSnapshot();
  });

  it('not report if fragment defined in other files', async () => {
    const errors = await validateSource(
      `
        gql\`
          fragment Test on User {
            ...HeaderUser
          }
          \${Header.fragments.user}
        \`
      `,
      {
        otherFiles: {
          'query/Header.js': `
            Header.fragments = {
              user: gql\`
                fragment HeaderUser on User {
                  name
                }
              \`,
            };
          `,
        },
      },
    );
    expect(errors).toEqual([]);
  });
});

describe('Rule: ConnectionDirective', () => {
  it('@connection should not be reported unknown', async () => {
    const errors = await validateSource(`
      gql\`
        query Users($offset: Int, $limit: Int) {
          users(
            offset: $offset,
            limit: $limit
          ) @connection(key: "user") {
            id
          }
        }
      \`
    `);
    expect(errors).toEqual([]);
  });

  it('report wrong filter key values', async () => {
    const errors = await validateSource(`
      gql\`
        query Users($offset: Int, $limit: Int) {
          users(
            offset: $offset,
            limit: $limit
          ) @connection(key: "user", filter: ["xoffset", "limit"]) {
            id
          }
        }
      \`
    `);
    expect(errors).toMatchSnapshot();
  });
});

describe('@client directive', () => {
  it('should not be reported unknown if linkState = true', async () => {
    const errors = await validateSource(
      `
      gql\`
        fragment Test on User {
          id @client
        }
      \`
    `,
      {
        presetOptions: { linkState: true },
      },
    );
    expect(errors).toEqual([]);
  });

  it('should be reported unknown if linkState = false', async () => {
    const errors = await validateSource(
      `
      gql\`
        fragment Test on User {
          id @client
        }
      \`
    `,
      {
        presetOptions: { linkState: false },
      },
    );
    expect(errors).toMatchSnapshot();
  });
});

describe('Rule: FieldsOnCorrectType', () => {
  describe('fields without @client directive', () => {
    it('should be reported unknown if linkState: true', async () => {
      const errors = await validateSource(
        `
          gql\`
            query Viewer {
              hello
            }
          \`
        `,
        {
          presetOptions: { linkState: true },
        },
      );
      expect(errors).toMatchSnapshot();
    });

    it('should be reported unknown if linkState: false', async () => {
      const errors = await validateSource(
        `
          gql\`
            query Viewer {
              hello
            }
          \`
        `,
        {
          presetOptions: { linkState: false },
        },
      );
      expect(errors).toMatchSnapshot();
    });
  });

  describe('fields with @client directive', () => {
    it('should not be reported unknown if linkState: true', async () => {
      const errors = await validateSource(
        `
          gql\`
            query Viewer {
              hello @client
            }
          \`
        `,
        {
          presetOptions: { linkState: true },
        },
      );
      expect(errors).toEqual([]);
    });

    it('should be reported unknown if linkState: false', async () => {
      const errors = await validateSource(
        `
          gql\`
            query Viewer {
              hello @client
            }
          \`
        `,
        {
          presetOptions: { linkState: false },
        },
      );
      expect(errors).toMatchSnapshot();
    });
  });
});
