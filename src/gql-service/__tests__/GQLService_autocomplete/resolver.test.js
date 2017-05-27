/* @flow */
import code from 'gql-test-utils/code';
import { mockTestResolverParser } from 'gql-schema-plugin-resolver/shared/test-utils';
import { autocomplete, allHints } from './utils';

beforeEach(() => {
  mockTestResolverParser('gql-resolver-parser-test');
});

test('Object Type', async () => {
  const hints = await autocomplete({
    sourcePath: 'resolvers/main.js',
    ...code(`
        resolvers[User/id] = func;

        resolvers[Player/id] = func;

        resolvers[Player/name] = func;
          #----------^
      `),
    resolverConfig: {
      files: 'resolvers/*.js',
      parser: 'test',
    },
  });
  expect(hints).toEqual(allHints.ObjectTypes);
});

test('Object Type Field', async () => {
  const hints = await autocomplete({
    sourcePath: 'resolvers/main.js',
    ...code(`
        resolvers[Player/name] = func;
        resolvers[Player/id] = func
        #----------------^
      `),
    resolverConfig: {
      files: 'resolvers/*.js',
      parser: 'test',
    },
  });
  expect(hints).toEqual(allHints.PlayerTypeFields);
});

test('Scalar Type', async () => {
  const hints = await autocomplete({
    sourcePath: 'resolvers/main.js',
    ...code(`
        scalars[Custo] = func;
       #---------^
      `),
    resolverConfig: {
      files: 'resolvers/*.js',
      parser: 'test',
    },
  });
  expect(hints).toEqual(allHints.ScalarTypes);
});

test('Directive', async () => {
  const hints = await autocomplete({
    sourcePath: 'resolvers/main.js',
    ...code(`
        directives[Custo] = func;
       #------------^
      `),
    resolverConfig: {
      files: 'resolvers/*.js',
      parser: 'test',
    },
  });
  expect(hints).toEqual(allHints.Directives);
});

describe('Enum', () => {
  test('Types', async () => {
    const hints = await autocomplete({
      sourcePath: 'resolvers/main.js',
      ...code(`
          enumTypes[Role] = func;
          #----------^
        `),
      resolverConfig: {
        files: 'resolvers/*.js',
        parser: 'test',
      },
    });
    expect(hints).toEqual(allHints.EnumTypes);
  });

  describe('EnumValue', () => {
    test('on type', async () => {
      const hints = await autocomplete({
        sourcePath: 'resolvers/main.js',
        ...code(`
            enumValues[Role] = func;
            #-----------^
          `),
        resolverConfig: {
          files: 'resolvers/*.js',
          parser: 'test',
        },
      });
      expect(hints).toEqual(allHints.EnumTypes);
    });

    test('on value', async () => {
      const hints = await autocomplete({
        sourcePath: 'resolvers/main.js',
        ...code(`
            enumValues[Role/roleA] = func;
                #-------------^
          `),
        resolverConfig: {
          files: 'resolvers/*.js',
          parser: 'test',
        },
      });
      expect(hints).toEqual(allHints.EnumRoleValues);
    });
  });
});

test('Type', async () => {
  const hints = await autocomplete({
    sourcePath: 'resolvers/main.js',
    ...code(`
        types[te] = func;
          #----^
      `),
    resolverConfig: {
      files: 'resolvers/*.js',
      parser: 'test',
    },
  });
  expect(hints).toEqual(allHints.ResolverTypes);
});

describe('Field', () => {
  test('Scalar', async () => {
    const hints = await autocomplete({
      sourcePath: 'resolvers/main.js',
      ...code(`
          fields[CustomScalar/test] = func;
              #----------------^
        `),
      resolverConfig: {
        files: 'resolvers/*.js',
        parser: 'test',
      },
    });
    expect(hints).toEqual([]);
  });

  test('Enum', async () => {
    const hints = await autocomplete({
      sourcePath: 'resolvers/main.js',
      ...code(`
        fields[Role/rol] = func;
            #--------^
      `),
      resolverConfig: {
        files: 'resolvers/*.js',
        parser: 'test',
      },
    });
    expect(hints).toEqual(allHints.EnumRoleValues);
  });

  test('Enum', async () => {
    const hints = await autocomplete({
      sourcePath: 'resolvers/main.js',
      ...code(`
        fields[Role/rol] = func;
            #--------^
      `),
      resolverConfig: {
        files: 'resolvers/*.js',
        parser: 'test',
      },
    });
    expect(hints).toEqual(allHints.EnumRoleValues);
  });

  test('ObjectType', async () => {
    const hints = await autocomplete({
      sourcePath: 'resolvers/main.js',
      ...code(`
        fields[Player/id] = func;
            #----------^
      `),
      resolverConfig: {
        files: 'resolvers/*.js',
        parser: 'test',
      },
    });
    expect(hints).toEqual(allHints.PlayerTypeFields);
  });

  test('InterfaceType', async () => {
    const hints = await autocomplete({
      sourcePath: 'resolvers/main.js',
      ...code(`
        fields[Node/id] = func;
            #-------^
      `),
      resolverConfig: {
        files: 'resolvers/*.js',
        parser: 'test',
      },
    });
    expect(hints).toEqual([]);
  });
});
