/* @flow */
import EmbeddedQueryParser from '../index';
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
      parser: new EmbeddedQueryParser({
        start: 'gql`',
        end: '`',
      }),
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
      parser: new EmbeddedQueryParser({
        start: 'graphql request\\s+"""',
        end: '"""',
      }),
    }),
  ).toMatchSnapshot();
});

test('should validate options', () => {
  expect(() => {
    /* eslint-disable no-new */
    // $FlowDisableNextLine
    new EmbeddedQueryParser({});
    /* eslint-enable no-new */
  }).toThrowErrorMatchingSnapshot();
});
