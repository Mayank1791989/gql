/* @flow */
import code from 'gql-test-utils/code';
import toOffset from '../toOffset';

test('offset', () => {
  const { sourceText, position } = code(`
    123456789
    1234
    ---^
  `);
  expect(toOffset(sourceText, position)).toEqual(9 + 1 /* EOL */ + 4);
});
