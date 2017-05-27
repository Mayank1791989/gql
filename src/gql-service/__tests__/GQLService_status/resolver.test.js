/* @flow */
import GQLService from '../../GQLService';
import { mockTestResolverParser } from 'gql-schema-plugin-resolver/shared/test-utils';
import { status as _status } from './utils';
import { createTempFiles } from 'gql-test-utils/file';
import { waitFor, conditions } from 'gql-test-utils/wait';
import path from 'path';
import fs from 'fs-extra';

beforeEach(() => {
  mockTestResolverParser('gql-resolver-parser-test');
});

const schemaFiles = {
  'schema/schema.gql': `
    type Query {
      viewer: Viewer
    }
    type Viewer {
      name: String
    }
  `,
};

describe('report error when schema changed', () => {
  async function createService() {
    const rootDir = createTempFiles({
      '.git/tmp': 'to trigger watchman events',
      '.gqlconfig': JSON.stringify({
        schema: {
          files: ['schema/*.gql'],
          validate: {
            config: {
              NoUnusedTypeDefinition: 'off',
            },
          },
          plugins: [
            [
              'resolver',
              {
                files: 'resolver/*.js',
                parser: 'test',
              },
            ],
          ],
        },
      }),
      ...schemaFiles,
    });

    const gql = new GQLService({
      configDir: rootDir,
      watch: true,
    });
    gql.onError(err => {
      throw err;
    });

    await gql.start();
    return { gql, rootDir };
  }

  test('schema', async () => {
    const { gql, rootDir } = await createService();
    const onChange = jest.fn();
    gql.onChange(onChange);

    fs.outputFile(
      path.join(rootDir, 'schema/scalar.gql'),
      'scalar customScalar',
    );
    await waitFor(conditions.mockFnCall(onChange));

    expect(gql.status()).toMatchSnapshot();

    fs.outputFile(
      path.join(rootDir, 'resolver/test.js'),
      'scalars[customScalar] = func;',
    );
    await waitFor(conditions.mockFnCall(onChange));

    expect(gql.status()).toEqual([]);

    await gql.stop();
  });

  // test('global', () => {});

  // test('schema', () => {});
});

describe('UniqueResolvers', () => {
  test('Single file', async () => {
    const errors = await status({
      ...schemaFiles,
      'resolvers/test.js': `
        resolvers[Test/id] = func;
        resolvers[Test/id] = func;
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('Multiple files', async () => {
    expect(
      await status({
        ...schemaFiles,
        'resolvers/testA.js': `
          resolvers[Test/id] = func;
        `,
        'resolvers/testB.js': `
          resolvers[Test/id] = func;
        `,
      }),
    ).toMatchSnapshot();
  });

  test('Can be disabled for some types', async () => {
    expect(
      await status(
        {
          ...schemaFiles,
          'resolvers/testA.js': `
            resolvers[Test/id] = func;
          `,
          'resolvers/testB.js': `
            resolvers[Test/id] = func;
          `,
        },
        {
          validate: {
            config: {
              UniqueResolvers: [
                'error',
                {
                  ignore: [{ typeName: 'Test' }],
                },
              ],
            },
          },
        },
      ),
    ).toMatchSnapshot();
  });

  test('Can be disabled for some fields', async () => {
    expect(
      await status(
        {
          ...schemaFiles,
          'resolvers/testA.js': `
            resolvers[Test/id] = func;
            resolvers[Test/name] = func;
          `,
          'resolvers/testB.js': `
            resolvers[Test/id] = func;
            resolvers[Test/name] = func;
          `,
        },
        {
          validate: {
            config: {
              UniqueResolvers: [
                'error',
                {
                  ignore: [{ typeName: 'Test', fieldName: 'name' }],
                },
              ],
            },
          },
        },
      ),
    ).toMatchSnapshot();
  });

  test.skip('Throw if invalid options passed', async () => {
    try {
      await status(
        {
          ...schemaFiles,
          'resolvers/testA.js': `
            scalars[Test/id] = func;
          `,
        },
        {
          validate: {
            config: {
              UniqueResolvers: ['error', 'tester'],
            },
          },
        },
      );
    } catch (err) {
      console.log(err);
    }
  });
});

describe('PossibleResolvers', () => {});

describe('ProvidedRequiredResolvers', () => {
  test('Scalars', async () => {
    const errors = await status({
      ...schemaFiles,
      'schema/scalars.gql': `
        scalar customScalarOne
        scalar customScalarTwo
      `,
      'resolvers/scalars.js': `
        scalars[customScalarOne] = func;
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('Directives', async () => {
    const errors = await status({
      ...schemaFiles,
      'schema/directives.gql': `
        directive @customDirective(if: Boolean) on FIELD
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('Mutations', async () => {
    const errors = await status({
      ...schemaFiles,
      'schema/scalars.gql': `
        type Mutation {
          name(input: Test): String!
          TestCreate(input: TestCreateInput): TestCreatePayload
        }

        input TestCreateInput {
          name: String
        }

        type TestCreatePayload {
          name: String
        }
      `,
      'resolvers/mutations.js': `
        resolvers[Mutation/name] = func;
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  test('Mutation extensions', async () => {
    const errors = await status({
      ...schemaFiles,
      'schema/scalars.gql': `
        type Mutation {
          name(value: String): String
        }

        extend type Mutation {
          TestCreate(input: TestCreateInput): TestCreatePayload
        }

        input TestCreateInput {
          name: String
        }

        type TestCreatePayload {
          name: String
        }
      `,
      'resolvers/mutations.js': `
        resolvers[Mutation/name] = func;
      `,
    });
    expect(errors).toMatchSnapshot();
  });
});

function status(files, params) {
  return _status(files, {
    resolverConfig: {
      files: 'resolvers/**/*.js',
      parser: 'test',
      ...params,
    },
  });
}
