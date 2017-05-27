/* @flow */
import EmbeddedQueryParserPkg from '../index';
import runParser from 'gql-test-utils/runParser';

test('support single line tag', () => {
  expect(
    runParser({
      sourceText: `
        gql\`
          fragment x on SomeType {
            name
          }
        \`
      `,
      parser: EmbeddedQueryParserPkg({
        start: 'gql`',
        end: '`',
      }).create(),
    }),
  ).toMatchSnapshot();
});

test('support multiline tags', () => {
  expect(
    runParser({
      sourceText: `
        some random text
        graphql request
        """
          fragment x on SomeType {
            name
          }
        """
        some random text
      `,
      parser: EmbeddedQueryParserPkg({
        start: 'graphql request\\s+"""',
        end: '"""',
      }).create(),
    }),
  ).toMatchSnapshot();
});

test('should validate options', () => {
  expect(() => {
    EmbeddedQueryParserPkg('some_wrong_options');
  }).toThrowErrorMatchingInlineSnapshot(`
"INVALID_PARSER_OPTIONS: Error in options passed to 'embedded-query-parser'. 

ParserOptions must be an object

Expected: {|
  start: string;
  end: string;
  allowFragmentWithoutName?: boolean;
  allowFragmentInterpolation?: boolean;
  allowDocumentInterpolation?: boolean;
|}

Actual Value: \\"some_wrong_options\\"

Actual Type: string
"
`);
});
