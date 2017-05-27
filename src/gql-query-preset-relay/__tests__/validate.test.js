/* @flow */
import { createTempFiles } from 'gql-test-utils/file';
import { dedent } from 'dentist';
import GQLService from 'gql-service';

async function validateSource(source: string): Promise<any> {
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
          mutation: Mutation!
        }

        type Viewer {
          me: User!
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
    }),

    watch: false,
  });

  gql.onError(err => {
    throw err;
  });

  await gql.start();

  return gql.status();
}

test('report error for missing subselection in fragments', async () => {
  const errors = await validateSource(`
    Relay.QL\`
      fragment on Viewer {
        me
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

test('allow field without subselection in fragments if @relay(pattern: true) is present', async () => {
  const errors = await validateSource(`
    Relay.QL\`
      fragment on UserCreatePayload @relay(pattern: true) {
        viewer
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

test('allow query without subselection', async () => {
  const errors = await validateSource(`
    Relay.QL\`
      query test { viewer }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

test('allow mutation without subselection', async () => {
  const errors = await validateSource(`
    Relay.QL\`
      mutation tester { UserCreate }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

describe('Rule: ArgumentsOfCorrectType', () => {
  it('report error for wrong type', async () => {
    const errors = await validateSource(`
      Relay.QL\`
        fragment on User {
          image(size: "some_string_value")
        }
      \`
    `);
    expect(errors).toMatchSnapshot();
  });
});

describe('Rule: ProvidedNonNullArguments', () => {
  it('report error if field arguments missing', async () => {
    const errors = await validateSource(`
      Relay.QL\`
        fragment on User {
          image
        }
      \`
    `);
    expect(errors).toMatchSnapshot();
  });

  it('allow mutation field without arguments', async () => {
    const errors = await validateSource(`
      Relay.QL\`
        mutation test { UserCreate }
      \`
    `);
    expect(errors).toMatchSnapshot();
  });
});

test('should not report errors for valid query', async () => {
  const errors = await validateSource(`
    Relay.QL\`
      fragment on User {
        name
        id
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

test('report if operation name missing', async () => {
  const errors = await validateSource(`
    Relay.QL\`
      query {
        viewer
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

describe('[Rule] Exactly One Definition', () => {
  test('valid', async () => {
    const errors = await validateSource(`
      Relay.QL\`
        fragment Test on User {
          name
          id
        }
      \`
    `);
    expect(errors).toEqual([]);
  });

  test('invalid', async () => {
    const errors = await validateSource(`
      import Relay from 'react-relay';

      const a = Relay.QL\`
        fragment Test on User {
          name
          id
        }

        fragment Test2 on User {
          name
        }
      \`
    `);
    expect(errors).toMatchSnapshot();
  });
});

test('[Rule] ExecutableDefinitions', async () => {
  const errors = await validateSource(`
    const a = Relay.QL\`
      type Tester {
        name: String
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});
