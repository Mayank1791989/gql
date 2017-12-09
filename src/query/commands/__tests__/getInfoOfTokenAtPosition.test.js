/* @flow */
import { getInfoOfTokenAtPosition } from '../index';
import { getSchema, code } from '../../../__test-data__/utils';

const schema = getSchema();
const relayQLParser = {
  isRelay: true,
  parser: ['EmbeddedQueryParser', { startTag: 'Relay.QL`', endTag: '`' }],
};

describe('fragments', () => {
  it('on Type', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
              #-----------^
          id
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toMatchSnapshot();
  });

  it('field: Should Include description, fieldDefn and output Type', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on NewPlayer {
          friend
          #--^
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toMatchSnapshot();
  });

  it('field arguments', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
          image(size
            #----^
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toMatchSnapshot();
  });
});

describe('directives', () => {
  it('core: name', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
          image @include(if: true)
            #--------^
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toMatchSnapshot();
  });

  it('core: args', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
          image @include(if: true)
                  #-------^
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toMatchSnapshot();
  });

  it('user defined: name', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
          image @customDirective(if: true)
            #-------^
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toMatchSnapshot();
  });

  it('user defined: args', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
          image @customDirective(if: true)
                          #------^
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toMatchSnapshot();
  });

  it('unknown: name', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
          image @xyzeagder(if: true)
            #-------^
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toEqual(null);
  });

  it('unknown directive: args', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
          image @xyzeagder(if: true)
                    #-------^
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toEqual(null);
  });

  it('known directive: unknown args', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
          image @include(ifs: true)
                  #-------^
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toEqual(null);
  });

  it('name info', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
          image @include(if: true)
            #------^
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toMatchSnapshot();
  });

  it('args', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
          image @include(if: true)
                   #------^
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toMatchSnapshot();
  });
});

describe('mutations', () => {
  it('type: include description', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        mutation {
     #-----^
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toMatchSnapshot();
  });

  it('field: Include both input and output type', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        mutation {
          PlayerCreate
          #-----^
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toMatchSnapshot();
  });

  it('input object fields', () => {
    const { sourceText, position } = code(`
      mutation {
        PlayerCreate(
          input: {
            id: "some_id",
            role:
        #----^
          }
        ) {
          player { id }
        }
      }
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, { parser: 'QueryParser' }),
    ).toMatchSnapshot();
  });
});

describe('subscriptions', () => {
  it('type: include description', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        subscription {
     #-----^
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toMatchSnapshot();
  });

  it('field: Include both input and output type', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        subscription {
          LikeStory
          #-----^
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toMatchSnapshot();
  });

  it('input object fields', () => {
    const { sourceText, position } = code(`
      subscription {
        LikeStory(
          input: {
            id: ,
        #----^
          }
        ) {
          clientSubscriptionId
        }
      }
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, { parser: 'QueryParser' }),
    ).toMatchSnapshot();
  });
});


describe('query', () => {
  it('query keyword', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        query Viewer { viewer }
        #--^
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toMatchSnapshot();
  });
  it('field', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        query Viewer { viewer }
              #-----------^
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toMatchSnapshot();
  });
});

describe('meta field __typename', () => {
  it('when inside Object Type', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment on Viewer {
          __typename
          #----^
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toMatchSnapshot();
  });
  it('when inside Interface Type', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment on Node {
          __typename
          #----^
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toMatchSnapshot();
  });
  it('when inside Union Type', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment on Entity {
          __typename
          #----^
        }
      \`
    `);
    expect(
      getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
    ).toMatchSnapshot();
  });
});

test('meta field __schema', () => {
  const { sourceText, position } = code(`
    const a = Relay.QL\`
      query Viewer {
        __schema
        #----^
      }
    \`
  `);
  expect(
    getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
  ).toMatchSnapshot();
});

test('meta field __type', () => {
  const { sourceText, position } = code(`
    const a = Relay.QL\`
      query Viewer {
        __type
        #--^
      }
    \`
  `);
  expect(
    getInfoOfTokenAtPosition(schema, sourceText, position, relayQLParser),
  ).toMatchSnapshot();
});

