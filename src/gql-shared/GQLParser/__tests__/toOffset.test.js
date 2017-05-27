/* @flow */
import code from 'gql-test-utils/code';
import toOffset from '../toOffset';

test('offset when line ending is \r', () => {
  const { sourceText, position } = code(
    // prettier-ignore
    [
      '123456789',
      '1234',
      '--^'
    ].join('\n'),
  );
  expect(toOffset(sourceText, position)).toEqual(9 + 1 /* EOL */ + 3);
});

test('offset when lineEnding is \r\n', () => {
  const { sourceText, position } = code(
    // prettier-ignore
    [
      '123456789',
      '1234',
      '--^'
    ].join('\r\n'),
  );
  expect(toOffset(sourceText, position)).toEqual(9 + 2 /* EOL */ + 3);
});
