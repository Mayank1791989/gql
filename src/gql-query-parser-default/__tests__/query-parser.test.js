/* @flow */
import queryParserPkg from '../index';
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
      parser: queryParserPkg({
        allowFragmentInterpolation: true,
        allowFragmentWithoutName: false,
        allowDocumentInterpolation: false,
      }).create(),
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
      parser: queryParserPkg({
        allowFragmentWithoutName: false,
        allowFragmentInterpolation: false,
        allowDocumentInterpolation: true,
      }).create(),
    }),
  ).toMatchSnapshot();
});

test('report invalid options', () => {
  expect(() => {
    queryParserPkg({
      xallowFragmentWithoutName: false,
    });
  }).toThrowErrorMatchingInlineSnapshot(`
"INVALID_PARSER_OPTIONS: Error in options passed to 'query-parser'. 

ParserOptions should not contain the key: \\"xallowFragmentWithoutName\\"

Expected: {|
  allowFragmentWithoutName?: boolean;
  allowFragmentInterpolation?: boolean;
  allowDocumentInterpolation?: boolean;
|}

Actual Value: {
  \\"xallowFragmentWithoutName\\": false
}

Actual Type: {
  xallowFragmentWithoutName: boolean;
}
"
`);
});
