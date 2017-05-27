/* @flow */
import { createTempFiles } from 'gql-test-utils/file';
import { dedent } from 'dentist';
import { type Options } from '../index';
import GQLService from 'gql-service';

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
    expect(errors).toMatchInlineSnapshot(`
Array [
  Object {
    "locations": Array [
      Object {
        "column": 8,
        "line": 3,
        "path": "$ROOT_DIR/query/test.js",
      },
    ],
    "message": "Unknown fragment \\"SomeUnknownFragment\\". (KnownFragmentNames)",
    "severity": "error",
  },
]
`);
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
    expect(errors).toMatchInlineSnapshot(`
Array [
  Object {
    "locations": Array [
      Object {
        "column": 41,
        "line": 6,
        "path": "$ROOT_DIR/query/test.js",
      },
    ],
    "message": "Unkown filter value \\"xoffset\\". Did you mean \\"offset\\"? (ConnectionDirective)",
    "severity": "error",
  },
]
`);
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
    expect(errors).toMatchInlineSnapshot(`
Array [
  Object {
    "locations": Array [
      Object {
        "column": 8,
        "line": 3,
        "path": "$ROOT_DIR/query/test.js",
      },
    ],
    "message": "Unknown directive \\"client\\". (KnownDirectives)",
    "severity": "error",
  },
]
`);
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
      expect(errors).toMatchInlineSnapshot(`
Array [
  Object {
    "locations": Array [
      Object {
        "column": 5,
        "line": 3,
        "path": "$ROOT_DIR/query/test.js",
      },
    ],
    "message": "Cannot query field \\"hello\\" on type \\"Query\\". (FieldsOnCorrectType)",
    "severity": "error",
  },
]
`);
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
      expect(errors).toMatchInlineSnapshot(`
Array [
  Object {
    "locations": Array [
      Object {
        "column": 5,
        "line": 3,
        "path": "$ROOT_DIR/query/test.js",
      },
    ],
    "message": "Cannot query field \\"hello\\" on type \\"Query\\". (FieldsOnCorrectType)",
    "severity": "error",
  },
]
`);
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
      expect(errors).toMatchInlineSnapshot(`
Array [
  Object {
    "locations": Array [
      Object {
        "column": 5,
        "line": 3,
        "path": "$ROOT_DIR/query/test.js",
      },
    ],
    "message": "Cannot query field \\"hello\\" on type \\"Query\\". (FieldsOnCorrectType)",
    "severity": "error",
  },
  Object {
    "locations": Array [
      Object {
        "column": 11,
        "line": 3,
        "path": "$ROOT_DIR/query/test.js",
      },
    ],
    "message": "Unknown directive \\"client\\". (KnownDirectives)",
    "severity": "error",
  },
]
`);
    });
  });
});

async function validateSource(
  source: string,
  opts?: {
    presetOptions?: Options,
    otherFiles?: { [name: string]: string },
  } = {},
) {
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
