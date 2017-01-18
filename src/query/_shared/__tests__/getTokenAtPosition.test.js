/* @flow */
import getTokenAtPosition from '../getTokenAtPosition';

const relayQLParser = ['EmbeddedQueryParser', { startTag: 'Relay.QL`', endTag: '`' }];

test('should able to parse Relay.QL tags', () => {
  const source = `
    const a = Relay.QL\`
      fragment on Test {
        name
        image
      }
    \`;
  `;

  const token = getTokenAtPosition(source, { line: 4, column: 21 }, relayQLParser);
  expect(token).toMatchSnapshot();
});

test('should able to parse multiple Relay.QL tags in single file', () => {
  const source = `
    const a = Relay.QL\`
      fragment on Test { image }
    \`;

    const b = Relay.QL\`
      fragment on Test { image }
    \`;
  `;

  const token = getTokenAtPosition(source, { line: 7, column: 21 }, relayQLParser);
  expect(token).toMatchSnapshot();
});

describe('should able to parse Relay.QL queries with interpolation', () => {
  it('single line', () => {
    const source = `
      const a = Relay.QL\`
        fragment Name on Test {
          \${abcd}
          name
        }
      \`;
    `;

    const token = getTokenAtPosition(source, { line: 5, column: 12 }, relayQLParser);
    expect(token).toMatchSnapshot();
  });

  it('multi line', () => {
    const source = `
      const a = Relay.QL\`
        fragment Name on Test {
          \${
              abcd
           }
           name
        }
      \`;
    `;

    const token = getTokenAtPosition(source, { line: 7, column: 14 }, relayQLParser);
    expect(token).toMatchSnapshot();
  });

  it('with curly braces inside interpolation', () => {
    const source = `
      const a = Relay.QL\`
        fragment Name on Test {
          \${abcd.getFramgent({
             var1: variables.var1
          })}
          name
        }
      \`;
    `;

    const token = getTokenAtPosition(source, { line: 7, column: 14 }, relayQLParser);
    expect(token).toMatchSnapshot();
  });

  it('[Bug] should able to parse fields after consecutive interpolated fragments', () => {
    const source = `
      const a = Relay.QL\`
        fragment XYZ on Test {
          \${fragment}
          \${fragment}
          name
        }
      \`;
    `;

    expect(() => getTokenAtPosition(source, { line: 6, column: 14 }, relayQLParser)).not.toThrow();
  });
});
