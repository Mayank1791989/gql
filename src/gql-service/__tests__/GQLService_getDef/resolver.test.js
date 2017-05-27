/* @flow */
import code from 'gql-test-utils/code';
import { mockTestResolverParser } from 'gql-schema-plugin-resolver/shared/test-utils';
import { getDef } from './utils';

beforeEach(() => {
  mockTestResolverParser('gql-resolver-parser-test');
});

test('Object types', async () => {
  const { defLocations, def } = await getDef({
    sourcePath: 'resolvers/test.js',
    ...code(`
      resolvers[Player/id] = func;

      resolvers[Player/name] = func;
        #---------^
    `),
    resolverConfig: {
      files: 'resolvers/*.js',
      parser: 'test',
    },
  });

  expect(def).toEqual([defLocations.Player]);
});

test('Object fields', async () => {
  const { defLocations, def } = await getDef({
    sourcePath: 'resolvers/test.js',
    ...code(`
      resolvers[Player/name] = func;

      resolvers[Player/id] = func;
        #---------------^
    `),
    resolverConfig: {
      files: 'resolvers/*.js',
      parser: 'test',
    },
  });

  expect(def).toEqual([defLocations.Player_id]);
});

test('Scalar', async () => {
  const { defLocations, def } = await getDef({
    sourcePath: 'resolvers/test.js',
    ...code(`
      resolvers[Player/name] = func;

      scalars[CustomScalar] = func;
        #----------^
    `),
    resolverConfig: {
      files: 'resolvers/*.js',
      parser: 'test',
    },
  });

  expect(def).toEqual([defLocations.CustomScalar]);
});

test('Directive', async () => {
  const { defLocations, def } = await getDef({
    sourcePath: 'resolvers/test.js',
    ...code(`
      directives[customDirective] = func;
        #----------^
    `),
    resolverConfig: {
      files: 'resolvers/*.js',
      parser: 'test',
    },
  });

  expect(def).toEqual([defLocations.customDirective]);
});

describe('Enum', () => {
  test('Types', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'resolvers/test.js',
      ...code(`
        enumTypes[Role] = func;
          #--------^
      `),
      resolverConfig: {
        files: 'resolvers/*.js',
        parser: 'test',
      },
    });

    expect(def).toEqual([defLocations.Role]);
  });

  describe('Values', () => {
    test('on Type', async () => {
      const { defLocations, def } = await getDef({
        sourcePath: 'resolvers/test.js',
        ...code(`
          enumValues[Role/roleA] = func;
            #---------^
        `),
        resolverConfig: {
          files: 'resolvers/*.js',
          parser: 'test',
        },
      });

      expect(def).toEqual([defLocations.Role]);
    });
    test('on Value', async () => {
      const { defLocations, def } = await getDef({
        sourcePath: 'resolvers/test.js',
        ...code(`
          enumValues[Role/roleA] = func;
            #--------------^
        `),
        resolverConfig: {
          files: 'resolvers/*.js',
          parser: 'test',
        },
      });

      expect(def).toEqual([defLocations.Role_roleA]);
    });
  });
});

describe('Type', () => {
  test('Scalar', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'resolvers/test.js',
      ...code(`
        types[CustomScalar] = func;
          #-----^
      `),
      resolverConfig: {
        files: 'resolvers/*.js',
        parser: 'test',
      },
    });

    expect(def).toEqual([defLocations.CustomScalar]);
  });

  test('Enum', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'resolvers/test.js',
      ...code(`
        types[Role] = func;
          #----^
      `),
      resolverConfig: {
        files: 'resolvers/*.js',
        parser: 'test',
      },
    });

    expect(def).toEqual([defLocations.Role]);
  });

  test('Object', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'resolvers/test.js',
      ...code(`
        types[Player] = func;
          #----^
      `),
      resolverConfig: {
        files: 'resolvers/*.js',
        parser: 'test',
      },
    });

    expect(def).toEqual([defLocations.Player]);
  });

  test('Interface', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'resolvers/test.js',
      ...code(`
        types[Node] = func;
          #----^
      `),
      resolverConfig: {
        files: 'resolvers/*.js',
        parser: 'test',
      },
    });

    expect(def).toEqual([defLocations.Node]);
  });

  test('Union', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'resolvers/test.js',
      ...code(`
        types[Entity] = func;
          #-----^
      `),
      resolverConfig: {
        files: 'resolvers/*.js',
        parser: 'test',
      },
    });

    expect(def).toEqual([defLocations.Entity]);
  });
});

describe('Fields', () => {
  describe('Object', () => {
    test('on type', async () => {
      const { defLocations, def } = await getDef({
        sourcePath: 'resolvers/test.js',
        ...code(`
          fields[Player/id] = func;
            #-----^
        `),
        resolverConfig: {
          files: 'resolvers/*.js',
          parser: 'test',
        },
      });

      expect(def).toEqual([defLocations.Player]);
    });
    test('on field', async () => {
      const { defLocations, def } = await getDef({
        sourcePath: 'resolvers/test.js',
        ...code(`
          fields[Player/id] = func;
            #-----------^
        `),
        resolverConfig: {
          files: 'resolvers/*.js',
          parser: 'test',
        },
      });

      expect(def).toEqual([defLocations.Player_id]);
    });
  });

  describe('Enum', () => {
    test('on Type', async () => {
      const { defLocations, def } = await getDef({
        sourcePath: 'resolvers/test.js',
        ...code(`
          fields[Role/roleA] = func;
            #-----^
        `),
        resolverConfig: {
          files: 'resolvers/*.js',
          parser: 'test',
        },
      });

      expect(def).toEqual([defLocations.Role]);
    });
    test('on Value', async () => {
      const { defLocations, def } = await getDef({
        sourcePath: 'resolvers/test.js',
        ...code(`
          fields[Role/roleA] = func;
            #------------^
        `),
        resolverConfig: {
          files: 'resolvers/*.js',
          parser: 'test',
        },
      });
      expect(def).toEqual([defLocations.Role_roleA]);
    });
  });

  describe('Interface', () => {
    test('on type', async () => {
      const { defLocations, def } = await getDef({
        sourcePath: 'resolvers/test.js',
        ...code(`
          fields[Node/id] = func;
            #-----^
        `),
        resolverConfig: {
          files: 'resolvers/*.js',
          parser: 'test',
        },
      });

      expect(def).toEqual([defLocations.Node]);
    });
    test('on field', async () => {
      const { defLocations, def } = await getDef({
        sourcePath: 'resolvers/test.js',
        ...code(`
          fields[Node/id] = func;
            #---------^
        `),
        resolverConfig: {
          files: 'resolvers/*.js',
          parser: 'test',
        },
      });

      expect(def).toEqual([defLocations.Node_id]);
    });
  });
});

describe('Inside Schema', () => {
  test('resolver not enabled', async () => {
    const { def } = await getDef({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test implements Node {
          test: string
          #--^
        }
      `),
    });
    expect(def).toEqual([]);
  });

  describe('when resolver enabled & present', () => {
    const resolver = {
      resolverConfig: {
        files: 'resolvers/*.js',
        parser: 'test',
      },
      otherFiles: {
        'resolvers/test.js': `
          resolvers[Test/id] = func;
          resolvers[Test/test] = func;
          scalars[STest] = func;
          directives[DTest] = func;
          enumTypes[ETest] = func;
          enumValues[ETestTwo/val1] = func;
        `,
      },
    };

    test('Object field', async () => {
      const { def } = await getDef({
        sourcePath: 'schema/test.graphql',
        ...code(`
          type Test implements Node {
            id: string
            test: string
          #--^
          }
        `),
        ...resolver,
      });
      expect(def).toMatchInlineSnapshot(`
        Array [
          Object {
            "end": Object {
              "column": 28,
              "line": 2,
            },
            "path": "$ROOT_DIR/resolvers/test.js",
            "start": Object {
              "column": 1,
              "line": 2,
            },
          },
        ]
      `);
    });

    test('Extend Object field', async () => {
      const { def } = await getDef({
        sourcePath: 'schema/test.graphql',
        ...code(`
          extend type Test {
            id: string
            test: string
          #--^
          }
        `),
        ...resolver,
      });
      expect(def).toMatchInlineSnapshot(`
        Array [
          Object {
            "end": Object {
              "column": 28,
              "line": 2,
            },
            "path": "$ROOT_DIR/resolvers/test.js",
            "start": Object {
              "column": 1,
              "line": 2,
            },
          },
        ]
      `);
    });

    test('interface field', async () => {
      const { def } = await getDef({
        sourcePath: 'schema/test.graphql',
        ...code(`
          interface Test {
            id: string
            test: string
          #--^
          }
        `),
        ...resolver,
      });
      expect(def).toEqual([]);
    });

    test('scalar type', async () => {
      const { def } = await getDef({
        sourcePath: 'schema/test.graphql',
        ...code(`
          scalar STest;
          #--------^
        `),
        ...resolver,
      });
      expect(def).toMatchInlineSnapshot(`
        Array [
          Object {
            "end": Object {
              "column": 22,
              "line": 3,
            },
            "path": "$ROOT_DIR/resolvers/test.js",
            "start": Object {
              "column": 1,
              "line": 3,
            },
          },
        ]
      `);
    });

    test('directive', async () => {
      const { def } = await getDef({
        sourcePath: 'schema/test.graphql',
        ...code(`
          directive @DTest(
          #------------^
            if: Boolean!
          ) on FIELD;
        `),
        ...resolver,
      });
      expect(def).toMatchInlineSnapshot(`
        Array [
          Object {
            "end": Object {
              "column": 25,
              "line": 4,
            },
            "path": "$ROOT_DIR/resolvers/test.js",
            "start": Object {
              "column": 1,
              "line": 4,
            },
          },
        ]
      `);
    });

    describe('enums', () => {
      test('type level resolvers', async () => {
        const { def } = await getDef({
          sourcePath: 'schema/test.graphql',
          ...code(`
            enum ETest {
              #----^
              val1
              val2
            }
          `),
          ...resolver,
        });
        expect(def).toMatchInlineSnapshot(`
          Array [
            Object {
              "end": Object {
                "column": 24,
                "line": 5,
              },
              "path": "$ROOT_DIR/resolvers/test.js",
              "start": Object {
                "column": 1,
                "line": 5,
              },
            },
          ]
        `);
      });

      test('value level resolvers', async () => {
        const { def } = await getDef({
          sourcePath: 'schema/test.graphql',
          ...code(`
            enum ETestTwo {
              val1
            #--^
              val2
            }
          `),
          ...resolver,
        });
        expect(def).toMatchInlineSnapshot(`
          Array [
            Object {
              "end": Object {
                "column": 33,
                "line": 6,
              },
              "path": "$ROOT_DIR/resolvers/test.js",
              "start": Object {
                "column": 1,
                "line": 6,
              },
            },
          ]
        `);
      });
    });
  });
});
