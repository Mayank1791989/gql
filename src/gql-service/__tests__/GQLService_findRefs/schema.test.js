/* @flow */
import code from 'gql-test-utils/code';
import { findRefs } from './utils';

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
