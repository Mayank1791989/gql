/* @flow */
import code from 'gql-test-utils/code';
import path from 'path';
import { getSchemaFiles, sortRefs, getAllRefs } from 'gql-test-utils/test-data';
import { createTempFiles } from 'gql-test-utils/file';
import GQLService from '../GQLService';

test('findRefs should return all references of token at given position', async () => {
  const dir = createTempFiles({
    '.gqlconfig': `
      {
        schema: {
          files: 'schema/*.gql',
        }
      }
    `,
    'schema/schema.gql': `
      type Query {
        viewer: Viewer
      }

      type Viewer {
        name: string
      }
    `,
  });
  const gql = new GQLService({
    configDir: dir,
    watch: false,
  });
  gql.onError(err => {
    throw err;
  });

  await gql.start();

  expect(
    gql.findRefs({
      sourcePath: path.join(dir, 'schema/user.gql'),
      ...code(`
        type User {
          viewer: Viewer
          #---------^
        }
      `),
    }),
  ).toMatchSnapshot();
});

test('should not throw if called before starting server', () => {
  const dir = createTempFiles({
    '.gqlconfig': `
      {
        schema: {
          files: 'schema/*.gql',
        }
      }
    `,
    'schema/schema.gql': `
      type Query {
        viewer: Viewer
      }

      type Viewer {
        name: string
      }
    `,
  });

  const gql = new GQLService({
    configDir: dir,
    watch: false,
  });
  gql.onError(err => {
    throw err;
  });

  const run = () =>
    gql.findRefs({
      sourcePath: path.join(dir, 'schema/user.gql'),
      ...code(`
        type User {
          viewer: Viewer
          #---------^
        }
      `),
    });

  expect(run).not.toThrow();
  expect(run()).toEqual([]);
});

describe('schema', () => {
  test('field type: ObjectType', async () => {
    const { allRefs, refs } = await findRefs({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test {
          field: Player,
          #--------^
        }
      `),
    });
    expect(refs).toEqual(allRefs.Player);
  });

  test('field type: Enum', async () => {
    const { allRefs, refs } = await findRefs({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test {
          field: Role,
          #-------^
        }
      `),
    });
    expect(refs).toEqual(allRefs.Role);
  });

  test('field type: CustomScalar', async () => {
    const { allRefs, refs } = await findRefs({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test {
          field: CustomScalar,
              #------^
        }
      `),
    });
    expect(refs).toEqual(allRefs.CustomScalar);
  });

  test('union type', async () => {
    const { allRefs, refs } = await findRefs({
      sourcePath: 'schema/test.graphql',
      ...code(`
        union Test = Player | Node;
            ----------^
      `),
    });
    expect(refs).toEqual(allRefs.Player);
  });

  test('arguments', async () => {
    const { allRefs, refs } = await findRefs({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test {
          test(a: CustomScalar): string
            #----------^
        }
      `),
    });
    expect(refs).toEqual(allRefs.CustomScalar);
  });

  test('implements', async () => {
    const { allRefs, refs } = await findRefs({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test implements Edge {
                      #-------^
          test: string
        }
      `),
    });
    expect(refs).toEqual(allRefs.Edge);
  });

  describe('unknown types', () => {
    test('single typo', async () => {
      const { refs } = await findRefs({
        sourcePath: 'schema/test.graphql',
        ...code(`
          type Test implements xEdge {
                            #----^
            test: string
          }
        `),
      });
      expect(refs).toEqual([]);
    });

    test('type deleted', async () => {
      const { allRefs, refs } = await findRefs({
        sourcePath: 'schema/test.graphql',
        ...code(`
          type Test {
            test: XPlayer
            #--------^
          }
        `),
      });
      expect(refs).toEqual(allRefs.XPlayer);
    });
  });

  test('core types', async () => {
    const { allRefs, refs } = await findRefs({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test  {
          test: Int
            #----^
        }
      `),
    });
    expect(refs).toEqual(allRefs.Int);
  });
});

async function findRefs({ sourceText, sourcePath, position }) {
  const rootDir = createTempFiles({
    '.gqlconfig': `
        {
          schema: {
            files: ['schema/*.gql', 'schema/*.graphql'],
          },
          query: {
            files: [
              {
                match: ['query/**/*.graphql', 'query/**/*.gql'],
              },
              {
                match: 'relay/**/*.js',
                presets: ['relay'],
              },
              {
                match: 'apollo/**/*.js',
                presets: ['apollo'],
              },
              {
                match: 'relay-modern/**/*.js',
                presets: ['relay-modern'],
              },
              {
                match: 'custom/**/*.xyz',
                parser: [
                  'embedded-queries',
                  {
                    start: '"""',
                    end: '"""',
                  }
                ],
                presets: ['default'],
              }
            ]
          }
        }
      `,
    ...getSchemaFiles(),
  });

  const gql = new GQLService({
    configDir: rootDir,
    watch: false,
  });
  gql.onError(err => {
    throw err;
  });

  await gql.start();

  const refs = gql
    .findRefs({
      sourcePath: path.join(rootDir, sourcePath),
      sourceText,
      position,
    })
    .sort(sortRefs);

  const allRefs = getAllRefs(rootDir);

  await gql.stop();

  return { allRefs, refs };
}
