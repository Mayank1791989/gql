/* @flow */
import { code } from '../../__test-data__/utils';
import toOffset from '../toOffset';

test('offset', () => {
  const { sourceText, position } = code(`
    123456789
    1234
    ---^
  `);
  expect(toOffset(sourceText, position)).toEqual(9 + 1 /* EOL */ + 4);
});
