/* @flow */
/* eslint-disable max-len */
import GQLService from '../../GQLService';
import { createTempFiles } from 'gql-test-utils/file';
import { status } from './utils';

test('should report errors in schema', async () => {
  const gql = new GQLService({
    configDir: createTempFiles({
      '.gqlconfig': `
        {
          schema: {
            files: 'schema/*.gql',
          }
        }
      `,
      'schema/schema.gql': `
        type Query {
          viewer: xViewer # missing viewer
        }
      `,
    }),
    watch: false,
  });
  gql.onError(err => {
    throw err;
  });
  await gql.start();
  expect(gql.status()).toMatchSnapshot();
  await gql.stop();
});

test('can modify validation rule severity', async () => {
  const gql = new GQLService({
    configDir: createTempFiles({
      'schema/schema.gql': `
        type Query {
          name: String
        }
        type Hello {
          name: String
        }
      `,
      '.gqlconfig': `{
        schema: {
          files: 'schema/*.gql',
          validate: {
            config: {
              NoUnusedTypeDefinition: 'error',
            },
          }
        }
      }`,
    }),
    watch: false,
  });
  gql.onError(err => {
    throw err;
  });
  await gql.start();
  expect(gql.status()).toMatchSnapshot();
  await gql.stop();
});

test('can turn off validation rules', async () => {
  const gql = new GQLService({
    configDir: createTempFiles({
      'schema/schema.gql': `
          type Query {
            name: String
          }
          type Hello {
            name: String
          }
        `,
      '.gqlconfig': `{
          schema: {
            files: 'schema/*.gql',
            validate: {
              config: {
                NoUnusedTypeDefinition: 'off',
              },
            }
          }
        }`,
    }),
    watch: false,
  });
  gql.onError(err => {
    throw err;
  });
  await gql.start();
  expect(gql.status()).toMatchSnapshot();
  await gql.stop();
});

test('report if no schema file exist or empty.', async () => {
  const gql = new GQLService({
    configDir: createTempFiles({
      '.gqlconfig': `{
          schema: {
            files: 'schema/*.gql',
          }
        }`,
    }),
    watch: false,
  });
  gql.onError(err => {
    throw err;
  });
  await gql.start();
  expect(gql.status()).toMatchSnapshot();
  await gql.stop();
});

test('Report if missing Query Root Type', async () => {
  const errors = await status({
    'schema/main.gql': `
      type Test {
        name: String!
      }
    `,
  });
  expect(errors).toMatchSnapshot();
});

describe('Report if Query type not ObjectType', () => {
  it('by type name', async () => {
    const errors = await status({
      'schema/main.gql': `
        input Query {
          name: String!
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  it('using schema', async () => {
    const errors = await status({
      'schema/main.gql': `
        scalar CustomScalar

        schema {
          query: CustomScalar
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });
});

test('Should able to use custom Query type', async () => {
  const errors = await status({
    'schema/main.gql': `
      type Viewer {
        id: ID!
      }

      schema {
        query: Viewer
      }
    `,
  });
  expect(errors).toEqual([]);
});

test('Report duplicate operation types', async () => {
  const errors = await status({
    'schema/main.gql': `
      type Viewer {
        id: ID!
      }
      type Player {
        name: String!
      }

      schema {
        query: Viewer
        query: Player
      }
    `,
  });
  expect(errors).toMatchSnapshot();
});

test('Report unknown operation type', async () => {
  const errors = await status({
    'schema/main.gql': `
      schema {
        query: Viewer
      }
    `,
  });
  expect(errors).toMatchSnapshot();
});

test('For simple schema only Query Type is enough', async () => {
  const errors = await status({
    'schema/main.gql': `
      type Query {
        name: String!
      }
    `,
  });
  expect(errors).toEqual([]);
});

describe('Report unknown types', () => {
  test('output field type', async () => {
    const errors = await status({
      'schema/main.gql': `
        type Query {
          name: String!
        }
        type Viewer {
          name: xString!
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('input field type', async () => {
    const errors = await status({
      'schema/main.gql': `
        type Query {
          name: String!
        }
        input Viewer {
          name: xString!
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('interface type', async () => {
    const errors = await status({
      'schema/main.gql': `
        type Query {
          name: String!
        }

        interface Node {
          id: ID!
        }

        type Viewer implements Node & xNode {
          id: ID!
          name: String!
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('union type', async () => {
    const errors = await status({
      'schema/main.gql': `
        type Query {
          name: String!
        }

        type Player {
          id: ID!
        }

        union Viewer = Player | xPlayer
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('arg type', async () => {
    const errors = await status({
      'schema/main.gql': `
        type Query {
          name: String!
        }

        type Player {
          image(size: xInt): String!
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });
});

describe('Report invalid objectType', () => {
  test('duplicate fields', async () => {
    const errors = await status({
      'schema/main.gql': `
        type Query {
          name: String!
        }

        type Player {
          id: ID!
          name: String!
          id: String!
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('field type not output type', async () => {
    const errors = await status({
      'schema/main.gql': `
        type Query {
          name: String!
        }

        type Player {
          name: String!
          value: InputValue!
          #--------^
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  // Bug in graphql-js validate not causing this error
  // enable test when fixed in graphql-js
  // eslint-disable-next-line no-restricted-properties
  test.skip('duplicate field args', async () => {
    const errors = await status({
      'schema/main.gql': `
        type Query {
          name: String!
        }

        type Player {
          image(size: Int!, id: String!, size: String): String!
        }
      `,
    });
    expect(errors).not.toEqual([]);
  });

  test('field arg type not input type', async () => {
    const errors = await status({
      'schema/main.gql': `
        type Query {
          name: String!
        }

        type Viewer {
          name: String!
        }

        type Player {
          image(size: Viewer!): String!
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('implements same interface multiple times', async () => {
    const errors = await status({
      'schema/main.gql': `
        type Query {
          name: String!
        }

        interface Node {
          id: ID!
        }

        interface User {
          id: ID!
          name: String!
        }

        type Player implements Node & User & Node {
          id: ID!
          name: String!
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('implementing non interface type', async () => {
    const errors = await status({
      'schema/main.gql': `
        type Query {
          name: String!
        }

        interface Node {
          id: ID!
        }

        type Player implements Node & String {
          id: ID!
          name: String!
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('type not implementing all interface fields', async () => {
    const errors = await status({
      'schema/query.gql': `
        type Query {
          name: String!
        }
      `,
      'schema/interface.gql': `
        interface User {
          id: ID!
          name: String!
        }
      `,
      'schema/main.gql': `
        type Player implements User {
          id: ID!
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('implemented interface fields type mismatch', async () => {
    const errors = await status({
      'schema/query.gql': `
        type Query {
          name: String!
        }
      `,
      'schema/interface.gql': `
        interface User {
          id: ID!
          name: String!
        }
      `,
      'schema/main.gql': `
        type Player implements User {
          id: ID!
          name: String
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('type doesnt implements all interface field args', async () => {
    const errors = await status({
      'schema/query.gql': `
        type Query {
          name: String!
        }
      `,
      'schema/interface.gql': `
        interface User {
          id: ID!
          image(size: Int!): String!
        }
      `,
      'schema/main.gql': `
        type Player implements User {
          id: ID!
          image: String!
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('implemented interface fields args type mismatch', async () => {
    const errors = await status({
      'schema/query.gql': `
        type Query {
          name: String!
        }
      `,
      'schema/interface.gql': `
        interface User {
          id: ID!
          image(size: Int!): String!
        }
      `,
      'schema/main.gql': `
        type Player implements User {
          id: ID!
          image(size: String!): String!
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('type provides additional args for interface fields', async () => {
    const errors = await status({
      'schema/query.gql': `
        type Query {
          name: String!
        }
      `,
      'schema/interface.gql': `
        interface User {
          id: ID!
          image(size: Int!): String!
        }
      `,
      'schema/main.gql': `
        type Player implements User {
          id: ID!
          image(size: Int!, id: Int!): String!
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });
});

describe('Report invalid unionType', () => {
  test('duplicate union members', async () => {
    const errors = await status({
      'schema/query.gql': `
        type Query {
          name: String!
        }
      `,
      'schema/interface.gql': `
        type User {
          id: ID!
          image(size: Int!): String!
        }
        type Player {
          id: ID!
        }
      `,
      'schema/main.gql': `
        union Viewer = User | Player | User
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('union member must be object type', async () => {
    const errors = await status({
      'schema/query.gql': `
        type Query {
          name: String!
        }
      `,
      'schema/types.gql': `
        type User {
          id: ID!
          image(size: Int!): String!
        }
      `,
      'schema/main.gql': `
        union Viewer = User | String
      `,
    });
    expect(errors).toMatchSnapshot();
  });
});

describe('Report invalid enumType', () => {
  test('duplicate values', async () => {
    const errors = await status({
      'schema/query.gql': `
        type Query {
          name: String!
        }
      `,
      'schema/main.gql': `
        enum Test {
          a
          b
          c
          a
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('invalid values', async () => {
    const errors = await status({
      'schema/query.gql': `
        type Query {
          name: String!
        }
      `,
      'schema/main.gql': `
        enum Test {
          true
          false
          null
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });
});

describe('Report invalid inputObjectType', () => {
  // enable when implemented in graphql-js
  // eslint-disable-next-line no-restricted-properties
  test.skip('duplicate fields', async () => {
    const errors = await status({
      'schema/query.gql': `
        type Query {
          name: String!
        }
      `,
      'schema/main.gql': `
        input PlayerCreateParams {
          id: ID!
          name: String!
          id: String!
        }
      `,
    });
    expect(errors).not.toEqual([]);
  });

  test('field type not inputType', async () => {
    const errors = await status({
      'schema/query.gql': `
        type Query {
          name: String!
        }
      `,
      'schema/main.gql': `
        type Player {
          name: String!
        }

        input PlayerCreateParams {
          id: ID!
          name: String!
          friends: [Player!]
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });
});

describe('Report unused type declaration', () => {
  test('Report unused type definition', async () => {
    const errors = await status({
      '.gqlconfig': `
        {
          schema: {
            files: 'schema/**/*.gql',
            validate: {
              config: {
                NoUnusedTypeDefinition: 'error'
              },
            }
          },
        }
      `,
      'schema/query.gql': `
        type Query {
          name: String!
        }
      `,
      'schema/main.gql': `
        type A {
          name: String
        }

        type X {
          name: A
          value: Int!
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('Dont report type unused if type implements interface', async () => {
    const errors = await status({
      '.gqlconfig': `
        {
          schema: {
            files: 'schema/**/*.gql',
          },
        }
      `,
      'schema/query.gql': `
        type Query {
          name: String!
        }
      `,
      'schema/main.gql': `
        interface Node {
          id: String!
        }

        type X implements Node {
          id: String!
          value: Int!
        }
      `,
    });
    expect(errors).toEqual([]);
  });
});
