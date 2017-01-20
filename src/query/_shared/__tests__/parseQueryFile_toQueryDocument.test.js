/* @flow */
import { toQueryDocument } from '../parseQueryFile';
import { Source } from 'graphql/language/source';

const relayParser = ['EmbeddedQueryParser', { startTag: 'Relay\\.QL`', endTag: '`' }];

test('plain queries', () => {
  const text = `
    fragment test on Viewer {
      image
    }
  `;

  const qd = toQueryDocument(
    new Source(text, 'query.js'),
    { parser: 'QueryParser' },
  );

  expect(qd).toMatchSnapshot();
});

test('works with invalid queries', () => {
  const text = `
    fragment Viewer {
      image
    }
  `;

  const qd = toQueryDocument(
    new Source(text, 'query.js'),
    { parser: 'QueryParser' },
  );

  expect(qd).toMatchSnapshot();
});

test('extract embedded queries', () => {
  const text = `
    fragments: {
      viewer: () => Relay.QL\`
        fragment test on Viewer {
          image
        }
      \`,
    },
  `;

  const qd = toQueryDocument(
    new Source(text, 'query.js'),
    { parser: relayParser, isRelay: true },
  );

  expect(qd).toMatchSnapshot();
});

test('extract embedded queries multiline tag', () => {
  const text = `
    some multiline tag
    \`
      fragment test on Test {
        name
      }
    \`
  `;

  const qd = toQueryDocument(
    new Source(text, 'query.js'),
    {
      parser: [
        'EmbeddedQueryParser',
        { startTag: 'some multiline tag\\s+`', endTag: '`' },
      ],
    },
  );

  expect(qd).toMatchSnapshot();
});

test('extract multiple embedded queries', () => {
  const text = `
    fragments: {
      viewer: () => Relay.QL\`
        fragment test on Viewer {
          image
        }
      \`,
    },

    fragments: {
      viewer: () => Relay.QL\`
        fragment test on Viewer {
          image
        }
      \`,
    };

    const a = Relay.QL\`
      fragment test on Viewer {
        image
      }
    \`;
  `;

  const qd = toQueryDocument(
    new Source(text, 'query.js'),
    { parser: relayParser, isRelay: true },
  );

  expect(qd).toMatchSnapshot();
});

test('add dummy fragment name if missing (relay)', () => {
  const text = `
    fragments: {
      viewer: () => Relay.QL\`
        fragment on Viewer {
          image
        }
      \`,
    },
  `;

  const qd = toQueryDocument(
    new Source(text, 'query.js'),
    { parser: relayParser, isRelay: true },
  );

  expect(qd).toMatchSnapshot();
});

test('add dummy fragment name if missing (relay) and `on` in next line', () => {
  const text = `
    fragments: {
      viewer: () => Relay.QL\`
        fragment
              on Viewer {
          image
        }
      \`,
    },
  `;

  const qd = toQueryDocument(
    new Source(text, 'query.js'),
    { parser: relayParser, isRelay: true },
  );

  expect(qd).toMatchSnapshot();
});

describe('replace inline js fragment with dummy fragment', () => {
  it('single line', () => {
    const text = `
      fragments: {
        viewer: () => Relay.QL\`
          fragment on Viewer {
            \${component.getFragment('viewer')} name
          }
        \`,
      },
    `;

    const qd = toQueryDocument(
      new Source(text, 'query.js'),
      { parser: relayParser, isRelay: true },
    );

    expect(qd).toMatchSnapshot();
  });

  it('multiline', () => {
    const text = `
      fragments: {
        viewer: () => Relay.QL\`
          fragment on Viewer {
            \${component.getFragment('viewer', {
              var1: variables.var1,
              var2: variables.var2,
            })} name
          }
        \`,
      },
    `;

    const qd = toQueryDocument(
      new Source(text, 'query.js'),
      { parser: relayParser, isRelay: true },
    );

    expect(qd).toMatchSnapshot();
  });
});

