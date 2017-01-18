/* @flow */
import { getInfoOfTokenAtPosition } from '../index';
import { getSchema, code } from '../../../__test-data__/utils';

const schema = getSchema();
const getInfo = (text) => {
  const { sourceText, position } = code(text);
  return getInfoOfTokenAtPosition(schema, sourceText, position);
};

test('field type: ObjectType', () => {
  const info = getInfo(`
    type Test {
      field: Player,
      #--------^
    }
  `);
  expect(info).toMatchSnapshot();
});

test('field type: Enum', () => {
  const info = getInfo(`
    type Test {
      field: Role,
        #-----^
    }
  `);
  expect(info).toMatchSnapshot();
});

test('field type: CustomScalar', () => {
  const info = getInfo(`
    type Test {
      field: CustomScalar,
        #--------^
    }
  `);
  expect(info).toMatchSnapshot();
});

test('union type', () => {
  const info = getInfo(`
    union Test = Player | NewPlayer;
      #------------^
  `);
  expect(info).toMatchSnapshot();
});

test('arguments', () => {
  const info = getInfo(`
    type Test {
      test(a: CustomScalar): string
        #--------^
    }
  `);
  expect(info).toMatchSnapshot();
});

test('implements', () => {
  const info = getInfo(`
    type Test implements Node {
                  #-------^
      test: string
    }
  `);
  expect(info).toMatchSnapshot();
});

// test.only('unknown type', () => {
//   const info = getInfo(`
//     type Test implements Node {
//       test: xString
//        #-------^
//     }
//   `);
//   expect(info).toEqual([]);
// });
