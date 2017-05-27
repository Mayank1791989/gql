/* @flow */
import extractDocuments from '../extractDocuments';
import { Source } from 'graphql/language/source';
import {
  queryParser,
  relayQLParser,
  embeddedQueryParser,
  apolloParser,
} from 'gql-test-utils/parsers';

test('plain queries', () => {
  const text = `
    fragment test on Viewer {
      image
    }
  `;

  expect(
    extractDocuments(new Source(text, 'query.js'), queryParser()),
  ).toMatchSnapshot();
});

test('works with invalid queries', () => {
  const text = `
    fragment Viewer {
      image
    }
  `;

  expect(
    extractDocuments(new Source(text, 'query.js'), queryParser()),
  ).toMatchSnapshot();
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

  expect(
    extractDocuments(new Source(text, 'query.js'), relayQLParser()),
  ).toMatchSnapshot();
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

  expect(
    extractDocuments(
      new Source(text, 'query.js'),
      embeddedQueryParser({
        start: 'some multiline tag\\s+`',
        end: '`',
      }),
    ),
  ).toMatchSnapshot();
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

  expect(
    extractDocuments(new Source(text, 'query.js'), relayQLParser()),
  ).toMatchSnapshot();
});

test('add dummy fragment name if missing (allowFragmentsWithoutName)', () => {
  const text = `
    fragments: {
      viewer: () => Relay.QL\`
        fragment on Viewer {
          image
        }
      \`,
    },
  `;

  expect(
    extractDocuments(new Source(text, 'query.js'), relayQLParser()),
  ).toMatchSnapshot();
});

test('add dummy fragment name if missing (allowFragmentsWithoutName) and `on` in next line', () => {
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

  expect(
    extractDocuments(new Source(text, 'query.js'), relayQLParser()),
  ).toMatchSnapshot();
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

    expect(
      extractDocuments(new Source(text, 'query.js'), relayQLParser()),
    ).toMatchSnapshot();
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

    expect(
      extractDocuments(new Source(text, 'query.js'), relayQLParser()),
    ).toMatchSnapshot();
  });
});

test('replace all irregular whitespace with space', () => {
  // NOTE between '©' and '2017' there is thin space '\u2009' not regular space ' '
  /* eslint-disable no-irregular-whitespace */
  const text = `
    //  © 2017

    Relay.QL\`
      fragment on Viewer {
        me
      }
    \`,
  `;
  /* eslint-enable no-irregular-whitespace */

  expect(
    extractDocuments(new Source(text, 'query.js'), relayQLParser()),
  ).toMatchSnapshot();
});

test('allow template string interpolation at document level', () => {
  // for apollo client which uses interpolation to include child components fragments
  // see http://dev.apollodata.com/react/fragments.html
  const text = `
    gql\`
      fragment FeedEntry on Entry {
        commentCount
        ...VoteButtons
        ...RepoInfo
      }
      \${VoteButtons.fragments.entry}
      \${RepoInfo.fragments.entry}
    \`
  `;

  expect(
    extractDocuments(new Source(text, 'query.js'), apolloParser()),
  ).toMatchSnapshot();
});

test('extract embedded query without end', () => {
  const text = `
    Relay.QL\`
      fragment test on Viewer {
        name
  `;

  expect(
    extractDocuments(new Source(text, 'query.js'), relayQLParser()),
  ).toMatchSnapshot();
});

test('should return empty array if no embedded start end found', () => {
  const text = `
    function some_dummy_code() {
      console.log('no graphql query in this file');
    }
  `;

  expect(
    extractDocuments(new Source(text, 'query.js'), relayQLParser()),
  ).toEqual([]);
});

test('should include empty embedded queries', () => {
  const text = `
    const q1 = gql\`
      fragment  test on Viewer {
        name
      }
    \`;

    // empty embedded query
    const q2 = gql\`
    \`;

    const q3 = gql\`
      fragment  test on Viewer {
        name
      }
    \`
  `;

  const queryDocuments = extractDocuments(
    new Source(text, 'query.js'),
    apolloParser(),
  );
  expect(queryDocuments.length).toEqual(3);
  expect(queryDocuments).toMatchSnapshot();
});
