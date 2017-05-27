/* @flow */
import QueryParser from '../index';
import runParser from 'gql-test-utils/runParser';

test('option: allowFragmentInterpolation', () => {
  expect(
    runParser({
      sourceText: `
        fragment x on SomeType {
          name
          \${Component.getFragment('someType')}
        }
      `,
      parser: new QueryParser({
        allowFragmentInterpolation: true,
      }),
    }),
  ).toMatchSnapshot();
});

test('option: allowDocumentInterpolation', () => {
  expect(
    runParser({
      sourceText: `
        fragment x on SomeType {
          name
        }
        \${some_imported_document}
      `,
      parser: new QueryParser({
        allowDocumentInterpolation: true,
      }),
    }),
  ).toMatchSnapshot();
});
