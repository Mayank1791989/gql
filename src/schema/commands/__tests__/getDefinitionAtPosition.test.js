/* @flow */
import { getDefinitionAtPosition } from '../index';
import { getDefLocations, getSchema, code } from '../../../__test-data__/utils';

const defLocations = getDefLocations();
const schema = getSchema();
const getDef = (text) => {
  const { sourceText, position } = code(text);
  return getDefinitionAtPosition(schema, sourceText, position);
};

test('field type: ObjectType', () => {
  const def = getDef(`
    type Test {
      field: Player,
        #------^
    }
  `);
  expect(def).toEqual(defLocations.Player);
});

test('field type: Enum', () => {
  const def = getDef(`
    type Test {
      field: Role,
        #-----^
    }
  `);
  expect(def).toEqual(defLocations.Role);
});

test('field type: CustomScalar', () => {
  const def = getDef(`
    type Test {
      field: CustomScalar,
        #---------^
    }
  `);
  expect(def).toEqual(defLocations.CustomScalar);
});

test('field type: Core Scalars', () => {
  const def = getDef(`
    type Test {
      field: String,
        #------^
    }
  `);
  expect(def).toEqual(null);
});

test('union type', () => {
  const def = getDef(`
    union Test = Player | NewPlayer;
        #----------^
  `);
  expect(def).toEqual(defLocations.Player);
});

test('unknown type', () => {
  const def = getDef(`
    type Test {
      field: xString,
        #------^
    }
  `);
  expect(def).toEqual(null);
});

test('arguments', () => {
  const def = getDef(`
    type Test {
      test(a: CustomScalar): string
        #-----------^
    }
  `);
  expect(def).toEqual(defLocations.CustomScalar);
});

test('implements', () => {
  const def = getDef(`
    type Test implements Node {
              #-----------^
      test: string
    }
  `);
  expect(def).toEqual(defLocations.Node);
});
