/* @flow */
import code from 'gql-test-utils/code';
import { getDef } from './utils';

test('field type: ObjectType', async () => {
  const { defLocations, def } = await getDef({
    sourcePath: 'schema/test.graphql',
    ...code(`
      type Test {
        field: Player,
        #-------^
      }
    `),
  });
  expect(def).toEqual([defLocations.Player]);
});

test('field type: Enum', async () => {
  const { defLocations, def } = await getDef({
    sourcePath: 'schema/test.graphql',
    ...code(`
      type Test {
        field: Role,
          #-----^
      }
    `),
  });
  expect(def).toEqual([defLocations.Role]);
});

test('field type: CustomScalar', async () => {
  const { defLocations, def } = await getDef({
    sourcePath: 'schema/test.graphql',
    ...code(`
      type Test {
        field: CustomScalar,
          #---------^
      }
    `),
  });
  expect(def).toEqual([defLocations.CustomScalar]);
});

test('field type: Core Scalars', async () => {
  const { def } = await getDef({
    sourcePath: 'schema/test.graphql',
    ...code(`
      type Test {
        field: String,
          #------^
      }
    `),
  });
  expect(def).toEqual([]);
});

test('union type', async () => {
  const { defLocations, def } = await getDef({
    sourcePath: 'schema/test.graphql',
    ...code(`
      union Test = Player | NewPlayer;
          #----------^
    `),
  });
  expect(def).toEqual([defLocations.Player]);
});

test('unknown type', async () => {
  const { def } = await getDef({
    sourcePath: 'schema/test.graphql',
    ...code(`
      type Test {
        field: xString,
          #------^
      }
    `),
  });
  expect(def).toEqual([]);
});

test('arguments', async () => {
  const { defLocations, def } = await getDef({
    sourcePath: 'schema/test.graphql',
    ...code(`
      type Test {
        test(a: CustomScalar): string
          #-----------^
      }
    `),
  });
  expect(def).toEqual([defLocations.CustomScalar]);
});

test('implements', async () => {
  const { defLocations, def } = await getDef({
    sourcePath: 'schema/test.graphql',
    ...code(`
      type Test implements Node {
                #-----------^
        test: string
      }
    `),
  });
  expect(def).toEqual([defLocations.Node]);
});
