/* @flow */
import code from 'gql-test-utils/code';
import { getInfo, allInfo } from './utils';

test('field type: ObjectType', async () => {
  const info = await getInfo({
    sourcePath: 'schema/test.graphql',
    ...code(`
      type Test {
        field: Player,
        #--------^
      }
    `),
  });
  expect(info).toEqual([allInfo.PlayerType]);
});

test('field type: Enum', async () => {
  const info = await getInfo({
    sourcePath: 'schema/test.graphql',
    ...code(`
      type Test {
        field: Role,
          #-----^
      }
    `),
  });
  expect(info).toEqual([allInfo.RoleEnum]);
});

test('field type: CustomScalar', async () => {
  const info = await getInfo({
    sourcePath: 'schema/test.graphql',
    ...code(`
      type Test {
        field: CustomScalar,
          #--------^
      }
    `),
  });
  expect(info).toEqual([allInfo.CustomScalar]);
});

test('union type', async () => {
  const info = await getInfo({
    sourcePath: 'schema/test.graphql',
    ...code(`
      union Test = Player | NewPlayer;
        #------------^
    `),
  });
  expect(info).toEqual([allInfo.PlayerType]);
});

test('arguments', async () => {
  const info = await getInfo({
    sourcePath: 'schema/test.graphql',
    ...code(`
      type Test {
        test(a: CustomScalar): string
          #--------^
      }
    `),
  });
  expect(info).toEqual([allInfo.CustomScalar]);
});

test('implements', async () => {
  const info = await getInfo({
    sourcePath: 'schema/test.graphql',
    ...code(`
      type Test implements Node {
                    #-------^
        test: string
      }
    `),
  });
  expect(info).toEqual([allInfo.NodeInterface]);
});

test('core types', async () => {
  const info = await getInfo({
    sourcePath: 'schema/test.graphql',
    ...code(`
      type Test {
        name: String
        #-------^
      }
    `),
  });
  expect(info).toEqual([allInfo.String]);
});

test('unknown type', async () => {
  const info = await getInfo({
    sourcePath: 'schema/test.graphql',
    ...code(`
      type Test implements Node {
        test: xString
        #-------^
      }
    `),
  });
  expect(info).toEqual([]);
});
