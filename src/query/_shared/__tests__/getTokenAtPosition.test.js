/* @flow */
import getTokenAtPosition from '../getTokenAtPosition';
import { code } from '../../../__test-data__/utils';

const relayQLParser = ['EmbeddedQueryParser', { startTag: 'Relay\\.QL`', endTag: '`' }];

test('should able to parse Relay.QL tags', () => {
  const { sourceText, position } = code(`
    const a = Relay.QL\`
      fragment on Test {
        name
        image
      #--^
      }
    \`;
  `);

  const token = getTokenAtPosition(sourceText, position, relayQLParser);
  // console.log(JSON.stringify(token, null, 2));
  expect(token).toMatchSnapshot();
});

test('should able to parse multiple Relay.QL tags in single file', () => {
  const { sourceText, position } = code(`
    const a = Relay.QL\`
      fragment on Test1 { image }
    \`;

    const box = Relay.QL\`
      fragment on Test2 { image }
        #----------^
    \`;
  `);

  const token = getTokenAtPosition(sourceText, position, relayQLParser);
  expect(token).toMatchSnapshot();
});

describe('should able to parse Relay.QL queries with interpolation', () => {
  it('single line', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment Name on Test {
          \${abcd}
          name
        #---^
        }
      \`;
    `);

    const token = getTokenAtPosition(sourceText, position, relayQLParser);
    expect(token).toMatchSnapshot();
  });

  it('multi line', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment Name on Test {
          \${
              abcd
           }
           name
         #---^
        }
      \`;
    `);

    const token = getTokenAtPosition(sourceText, position, relayQLParser);
    expect(token).toMatchSnapshot();
  });

  it('with curly braces inside interpolation', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment Name on Test {
          \${abcd.getFramgent({
             var1: variables.var1
          })}
          name
        #---^
        }
      \`;
    `);

    const token = getTokenAtPosition(sourceText, position, relayQLParser);
    expect(token).toMatchSnapshot();
  });

  it('[Bug] should able to parse fields after consecutive interpolated fragments', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment XYZ on Test {
          \${fragment}
          \${fragment}
          name
         #--^
        }
      \`;
    `);

    expect(() => getTokenAtPosition(sourceText, position, relayQLParser)).not.toThrow();
  });
});

it('[Bug] should works for start position', () => {
  const sourceText = 'fragment';
  const token = getTokenAtPosition(sourceText, { line: 1, column: 1 }, 'QueryParser');
  expect(token).toMatchSnapshot();
});

it('[Bug] should works for empty sourceText', () => {
  const sourceText = '';
  const token = getTokenAtPosition(sourceText, { line: 1, column: 1 }, 'QueryParser');
  expect(token).toMatchSnapshot();
});
