/* @flow */
import code from 'gql-test-utils/code';
import { mockTestResolverParser } from 'gql-schema-plugin-resolver/shared/test-utils';
import { getInfo, allInfo } from './utils';

beforeEach(() => {
  mockTestResolverParser('gql-resolver-parser-test');
});

describe('Object Type', () => {
  test('on Type', async () => {
    const info = await getInfo({
      sourcePath: 'resolvers/test.js',
      ...code(`
          resolvers[Player/name] = func;

          resolvers[Player/id] = func;
            #----------^
        `),
      resolverConfig: {
        files: 'resolvers/*.js',
        parser: 'test',
      },
    });
    expect(info).toEqual([allInfo.PlayerType]);
  });

  test('on Field', async () => {
    const info = await getInfo({
      sourcePath: 'resolvers/test.js',
      ...code(`
          resolvers[Player/name] = func;

          resolvers[NewPlayer/friend] = func;
            #------------------^
        `),
      resolverConfig: {
        files: 'resolvers/*.js',
        parser: 'test',
      },
    });
    expect(info).toEqual([allInfo.NewPlayerFriendField]);
  });
});

test('Scalars', async () => {
  const info = await getInfo({
    sourcePath: 'resolvers/test.js',
    ...code(`
        scalars[CustomScalar] = func;
        #---------^
      `),
    resolverConfig: {
      files: 'resolvers/*.js',
      parser: 'test',
    },
  });
  expect(info).toEqual([allInfo.CustomScalar]);
});

test('Directive', async () => {
  const info = await getInfo({
    sourcePath: 'resolvers/test.js',
    ...code(`
        directives[customDirective] = func;
        #-------------^
      `),
    resolverConfig: {
      files: 'resolvers/*.js',
      parser: 'test',
    },
  });
  expect(info).toEqual([allInfo.CustomDirective]);
});

describe('Enums', () => {
  test('Types', async () => {
    const info = await getInfo({
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
    expect(info).toEqual([allInfo.RoleEnum]);
  });

  describe('Values', () => {
    test('on Type', async () => {
      const info = await getInfo({
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

      expect(info).toEqual([allInfo.RoleEnum]);
    });
    test('on Value', async () => {
      const info = await getInfo({
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
      expect(info).toEqual([allInfo.RoleEnum_roleA]);
    });
  });
});

describe('Type', () => {
  test('ObjectType', async () => {
    const info = await getInfo({
      sourcePath: 'resolvers/test.js',
      ...code(`
          types[Player] = func;
            #------^
        `),
      resolverConfig: {
        files: 'resolvers/*.js',
        parser: 'test',
      },
    });
    expect(info).toEqual([allInfo.PlayerType]);
  });

  test('Interface', async () => {
    const info = await getInfo({
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
    expect(info).toEqual([allInfo.NodeInterface]);
  });

  test('Enum', async () => {
    const info = await getInfo({
      sourcePath: 'resolvers/test.js',
      ...code(`
          types[Role] = func;
            #-----^
        `),
      resolverConfig: {
        files: 'resolvers/*.js',
        parser: 'test',
      },
    });
    expect(info).toEqual([allInfo.RoleEnum]);
  });

  test('Scalar', async () => {
    const info = await getInfo({
      sourcePath: 'resolvers/test.js',
      ...code(`
          types[CustomScalar] = func;
          #---------^
        `),
      resolverConfig: {
        files: 'resolvers/*.js',
        parser: 'test',
      },
    });
    expect(info).toEqual([allInfo.CustomScalar]);
  });
});

describe('Field', () => {
  describe('Object', () => {
    test('on type', async () => {
      const info = await getInfo({
        sourcePath: 'resolvers/test.js',
        ...code(`
            fields[Player/id] = func;
              #-------^
          `),
        resolverConfig: {
          files: 'resolvers/*.js',
          parser: 'test',
        },
      });
      expect(info).toEqual([allInfo.PlayerType]);
    });
    test('on Field', async () => {
      const info = await getInfo({
        sourcePath: 'resolvers/test.js',
        ...code(`
          fields[Player/name] = func;

          fields[NewPlayer/friend] = func;
            #-----------------^
        `),
        resolverConfig: {
          files: 'resolvers/*.js',
          parser: 'test',
        },
      });
      expect(info).toEqual([allInfo.NewPlayerFriendField]);
    });
  });

  describe('Enum', () => {
    test('on Type', async () => {
      const info = await getInfo({
        sourcePath: 'resolvers/test.js',
        ...code(`
              fields[Role/roleA] = func;
                #------^
            `),
        resolverConfig: {
          files: 'resolvers/*.js',
          parser: 'test',
        },
      });

      expect(info).toEqual([allInfo.RoleEnum]);
    });
    test('on Value', async () => {
      const info = await getInfo({
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
      expect(info).toEqual([allInfo.RoleEnum_roleA]);
    });
  });
});
