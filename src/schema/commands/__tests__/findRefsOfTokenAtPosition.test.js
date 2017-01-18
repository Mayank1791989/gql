/* @flow */
import { findRefsOfTokenAtPosition } from '../index';
import { getRefLocations, getSchema, code } from '../../../__test-data__/utils';

const refLocations = getRefLocations();
const schema = getSchema();
const findRefs = (sourceText, position) => (
  findRefsOfTokenAtPosition(schema, sourceText, position)
);

test('field type: ObjectType', () => {
  const { sourceText, position } = code(`
    type Test {
      field: Player,
      #--------^
    }
  `);
  expect(
    findRefs(sourceText, position),
  ).toEqual(refLocations.Player);
});

test('field type: Enum', () => {
  const { sourceText, position } = code(`
    type Test {
      field: Role,
      #-------^
    }
  `);
  expect(
    findRefs(sourceText, position),
  ).toEqual(refLocations.Role);
});

test('field type: CustomScalar', () => {
  const { sourceText, position } = code(`
    type Test {
      field: CustomScalar,
          #------^
    }
  `);
  expect(
    findRefs(sourceText, position),
  ).toEqual(refLocations.CustomScalar);
});

test('union type', () => {
  const { sourceText, position } = code(`
    union Test = Player | Node;
          ----------^
  `);
  expect(findRefs(sourceText, position)).toEqual(refLocations.Player);
});

test('arguments', () => {
  const { sourceText, position } = code(`
    type Test {
      test(a: CustomScalar): string
        #----------^
    }
  `);
  expect(findRefs(sourceText, position)).toEqual(refLocations.CustomScalar);
});

test('implements', () => {
  const { sourceText, position } = code(`
    type Test implements Edge {
                  #-------^
      test: string
    }
  `);
  expect(findRefs(sourceText, position)).toEqual(refLocations.Edge);
});

test('unknown types', () => {
  const { sourceText, position } = code(`
    type Test implements xEdge {
                  #-------^
      test: string
    }
  `);
  expect(findRefs(sourceText, position)).toEqual([]);
});
