/* @flow */
import { getHintsAtPosition } from '../index';
import { getHints, getSchema, code } from '../../../__test-data__/utils';

const hints = getHints();
const relayConfig = {
  parser: ['EmbeddedQueryParser', { startTag: 'Relay.QL`', endTag: '`' }],
  isRelay: true,
};
const queryConfig = {
  parser: 'QueryParser',
};

const schema = getSchema();

describe('fragments', () => {
  it('on Type suggestions', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on   #
          ---------------^
      \`;
    `);

    expect(
      getHintsAtPosition(schema, sourceText, position, relayConfig),
    ).toEqual(hints.CompositeTypes);
  });

  it('on Type suggestions after few characters', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Pl  #
          ----------------^
      \`;
    `);

    expect(
      getHintsAtPosition(schema, sourceText, position, relayConfig),
    ).toEqual(hints.CompositeTypes);
  });

  it('fields suggestions: Simple', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
                #
         #---^
        }
      \`;
    `);

    expect(
      getHintsAtPosition(schema, sourceText, position, relayConfig),
    ).toEqual(hints.PlayerTypeFields);
  });

  it('alias fields', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
          some:    #
          ------^
        }
      \`;
    `);

    expect(
      getHintsAtPosition(schema, sourceText, position, relayConfig),
    ).toEqual(hints.PlayerTypeFields);
  });

  it('[Relay] fields after interpolation', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
          id
          \${Component.getFragment('player')}
                 #
          #---^
        }
      \`;
    `);

    expect(
      getHintsAtPosition(schema, sourceText, position, relayConfig),
    ).toEqual(hints.PlayerTypeFields);
  });

  it('fields args', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
          image()
          ------^
        }
      \`;
    `);
    expect(
      getHintsAtPosition(schema, sourceText, position, relayConfig),
    ).toEqual(hints.PlayerTypeImageFieldArgs);
  });

  it('inline fragments on Type', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Node {
          id
          ...on   #
          ------^
        }
      \`;
    `);
    expect(
      getHintsAtPosition(schema, sourceText, position, relayConfig),
    ).toEqual(hints.TypesImplementsNode);
  });

  it('inline fragments on Type fields', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Node {
          id
          ...on Player {
                #
           #--^
          }
        }
      \`;
    `);
    expect(
      getHintsAtPosition(schema, sourceText, position, relayConfig),
    ).toEqual(hints.PlayerTypeFields);
  });
});

describe('mutation', () => {
  it('fields', () => {
    const { sourceText, position } = code(`
      Relay.QL\`
        mutation { }
        ----------^
      \`;
    `);
    expect(
      getHintsAtPosition(schema, sourceText, position, relayConfig),
    ).toEqual(hints.PossibleMutations);
  });

  it('field args', () => {
    const { sourceText, position } = code(`
      mutation {
        PlayerCreate()
        -------------^
      }
    `);
    expect(
      getHintsAtPosition(schema, sourceText, position, queryConfig),
    ).toMatchSnapshot();
  });
});

describe('Values', () => {
  it('enum value suggesstion', () => {
    const { sourceText, position } = code(`
      fragment test on NewPlayer {
        image(role: )
        #----------^
      }
    `);
    expect(
      getHintsAtPosition(schema, sourceText, position, queryConfig),
    ).toEqual(hints.EnumRoleValues);
  });

  it('Object value keys', () => {
    const { sourceText, position } = code(`
      mutation {
        PlayerCreate(
          input: {
            id: "string",
              #
        #---^
          }
        })
      }
    `);
    expect(
      getHintsAtPosition(schema, sourceText, position, queryConfig),
    ).toMatchSnapshot();
  });
});

describe('query', () => {
  it('fields', () => {
    const { sourceText, position } = code(`
      Relay.QL\`
        query Test { }
        ------------^
      \`;
    `);
    expect(
      getHintsAtPosition(schema, sourceText, position, relayConfig),
    ).toEqual(hints.QueryFields);
  });
});

describe('directives', () => {
  it('directives', () => {
    const { sourceText, position } = code(`
      fragment on Test {
        id @inc
      --------^
      }
    `);
    expect(
      getHintsAtPosition(schema, sourceText, position, queryConfig),
    ).toMatchSnapshot();
  });

  it('directives: include relay directives', () => {
    const { sourceText, position } = code(`
      Relay.QL\`
        fragment on Test @relay {
                #----------^
        }
      \`;
    `);
    expect(
      getHintsAtPosition(schema, sourceText, position, relayConfig),
    ).toMatchSnapshot();
  });

  it('args', () => {
    const { sourceText, position } = code(`
      Relay.QL\`
        fragment on Test @relay() {
            --------------------^
          id
        }
      \`;
    `);
    expect(
      getHintsAtPosition(schema, sourceText, position, relayConfig),
    ).toMatchSnapshot();
  });

  it('args: value', () => {
    const { sourceText, position } = code(`
      Relay.QL\`
        fragment on Test @relay(pattern:  ) {
                                ---------^
          id
        }
      \`;
    `);
    expect(
      getHintsAtPosition(schema, sourceText, position, relayConfig),
    ).toMatchSnapshot();
  });
});


describe('show meta field __typename in abstract types', () => {
  it('interface type', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment on Node {
          id
          __type
        #-------^
        }
      \`
    `);
    expect(
      getHintsAtPosition(schema, sourceText, position, relayConfig),
    ).toMatchSnapshot();
  });

  it('union type', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment on Entity {
          __type
        #-------^
        }
      \`
    `);
    expect(
      getHintsAtPosition(schema, sourceText, position, relayConfig),
    ).toMatchSnapshot();
  });
});

describe('subscription', () => {
  it('fields', () => {
    const { sourceText, position } = code(`
      Relay.QL\`
        subscription { }
        --------------^
      \`;
    `);
    expect(
      getHintsAtPosition(schema, sourceText, position, relayConfig),
    ).toEqual(hints.PossibleSubscriptions);
  });

  it('field args', () => {
    const { sourceText, position } = code(`
      subscription {
        LikeStory()
        ----------^
      }
    `);
    expect(
      getHintsAtPosition(schema, sourceText, position, queryConfig),
    ).toMatchSnapshot();
  });
});

describe('[Bug] should work if position is first character', () => {
  it('whitespace', () => {
    const sourceText = ' ';
    expect(
      getHintsAtPosition(schema, sourceText, { line: 1, column: 1 }, queryConfig),
    ).toEqual(hints.DocumentLevel);
  });

  it('mutation keyword', () => {
    const sourceText = 'mutation';
    expect(
      getHintsAtPosition(schema, sourceText, { line: 1, column: 1 }, queryConfig),
    ).toMatchSnapshot();
  });

  it('fragment keyword', () => {
    const sourceText = 'fragment';
    expect(
      getHintsAtPosition(schema, sourceText, { line: 1, column: 1 }, queryConfig),
    ).toEqual([{ text: 'fragment' }]);
  });
});

test('[Bug] should work with empty sourceText', () => {
  const sourceText = '';
  expect(
    getHintsAtPosition(schema, sourceText, { line: 1, column: 1 }, queryConfig),
  ).toEqual(hints.DocumentLevel);
});
