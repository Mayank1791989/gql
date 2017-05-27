/* @flow */
import code from 'gql-test-utils/code';
import { replaceLineEndings, LINE_ENDING } from 'gql-shared/text';
import { autocomplete, allHints } from './utils';

describe('fragments', () => {
  it('on Type suggestions', async () => {
    const result = await autocomplete({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on   #
            ---------------^
        \`;
      `),
    });
    expect(result).toEqual(allHints.CompositeTypes);
  });

  it('on Type suggestions after few characters', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Pl  #
            ----------------^
        \`;
      `),
    });
    expect(hints).toEqual(allHints.CompositeTypes);
  });

  it('fields suggestions: Simple', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
                  #
          #---^
          }
        \`;
      `),
    });

    expect(hints).toEqual(allHints.PlayerTypeFields);
  });

  it('alias fields', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
            some:    #
            ------^
          }
        \`;
      `),
    });

    expect(hints).toEqual(allHints.PlayerTypeFields);
  });

  it('[Relay] fields after interpolation', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
            id
            \${Component.getFragment('player')}
                  #
            #---^
          }
        \`;
      `),
    });

    expect(hints).toEqual(allHints.PlayerTypeFields);
  });

  it('fields args', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
            image()
            ------^
          }
        \`;
      `),
    });
    expect(hints).toEqual(allHints.PlayerTypeImageFieldArgs);
  });

  it('inline fragments on Type', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Node {
            id
            ...on   #
            ------^
          }
        \`;
      `),
    });
    expect(hints).toEqual(allHints.TypesImplementsNode);
  });

  it('inline fragments on Type fields', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Node {
            id
            ...on Player {
                  #
            #--^
            }
          }
        \`;
      `),
    });
    expect(hints).toEqual(allHints.PlayerTypeFields);
  });
});

describe('mutation', () => {
  it('fields', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay/test.js',
      ...code(`
        Relay.QL\`
          mutation { }
          ----------^
        \`;
      `),
    });
    expect(hints).toEqual(allHints.PossibleMutations);
  });

  it('field args', async () => {
    const hints = await autocomplete({
      sourcePath: 'query/test.graphql',
      ...code(`
        mutation {
          PlayerCreate()
          -------------^
        }
      `),
    });
    expect(hints).toEqual(allHints.PlayerCreateArgs);
  });

  it('variable definition types', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay-modern/test.js',
      ...code(`
        graphql\`
          mutation PlayerCreate($input: C )
                    #--------------------^
        \`
      `),
    });
    expect(hints).toEqual(allHints.InputTypes);
  });
});

describe('query', () => {
  it('fields', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay/test.js',
      ...code(`
        Relay.QL\`
          query Test { }
          ------------^
        \`;
      `),
    });
    expect(hints).toEqual(allHints.QueryFields);
  });
});

describe('subscription', () => {
  it('fields', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay/test.js',
      ...code(`
        Relay.QL\`
          subscription { }
          --------------^
        \`;
      `),
    });
    expect(hints).toEqual(allHints.PossibleSubscriptions);
  });

  it('field args', async () => {
    const hints = await autocomplete({
      sourcePath: 'query/test.graphql',
      ...code(`
        subscription {
          LikeStory()
          ----------^
        }
      `),
    });
    expect(hints).toEqual(allHints.LikeStorySubscriptionArgs);
  });
});

describe('values', () => {
  it('enum value suggesstion', async () => {
    const hints = await autocomplete({
      sourcePath: 'query/test.gql',
      ...code(`
        fragment test on NewPlayer {
          image(role: )
          #----------^
        }
      `),
    });
    expect(hints).toEqual(allHints.EnumRoleValues);
  });

  it('Object value keys', async () => {
    const hints = await autocomplete({
      sourcePath: 'query/test.graphql',
      ...code(`
        mutation {
          PlayerCreate(
            input: {
              id: "string",
                #
          #---^
            }
          })
        }
      `),
    });
    expect(hints).toEqual(allHints.PlayerCreateInputFields);
  });
});

describe('directives', () => {
  it('directives', async () => {
    const hints = await autocomplete({
      sourcePath: 'query/test.gql',
      ...code(`
        fragment on Test {
          id @inc
        --------^
        }
      `),
    });
    expect(hints).toEqual(allHints.FieldDirectives);
  });

  it('directives: include relay directives', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay/test.js',
      ...code(`
        Relay.QL\`
          fragment on Test @relay {
                  #----------^
          }
        \`;
      `),
    });
    expect(hints).toMatchInlineSnapshot(`
      Array [
        Object {
          "description": "some custom directive",
          "text": "customDirective",
          "type": "Directive",
        },
        Object {
          "description": "",
          "text": "relay",
          "type": "Directive",
        },
      ]
    `);
  });

  it('args', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay/test.js',
      ...code(`
        Relay.QL\`
          fragment on Test @relay() {
              --------------------^
            id
          }
        \`;
      `),
    });
    expect(hints).toEqual(allHints.RelayDirectiveArgs);
  });

  it('args: value', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay/test.js',
      ...code(`
        Relay.QL\`
          fragment on Test @relay(pattern:  ) {
                                  ---------^
            id
          }
        \`;
      `),
    });
    expect(hints).toMatchInlineSnapshot(`
      Array [
        Object {
          "description": "Not true.",
          "text": "false",
          "type": "Boolean",
        },
        Object {
          "description": "Not false.",
          "text": "true",
          "type": "Boolean",
        },
      ]
    `);
  });
});

describe('fragmentSpread', () => {
  test('show fragments defined in same document', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay-modern/test.js',
      ...code(`
          const a = graphql\`
            fragment Test on Player {
              id
              ...
            #----^
            }

            fragment ProfileA on Player {
              id
            }
          \`
        `),
    });
    expect(hints).toMatchInlineSnapshot(`
      Array [
        Object {
          "description": "fragment ProfileA on Player",
          "text": "ProfileA",
          "type": "Player",
        },
      ]
    `);
  });

  test('show fragments defined in same file', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay-modern/test.js',
      ...code(`
        const a = graphql\`
          fragment Test on Player {
            id
            ...
          #----^
          }
        \`

        const b = graphql\`
          fragment ProfileB on Player {
            id
          }
        \`
      `),
    });
    expect(hints).toMatchInlineSnapshot(`
      Array [
        Object {
          "description": "fragment ProfileB on Player",
          "text": "ProfileB",
          "type": "Player",
        },
      ]
    `);
  });

  test('show fragments defined in other files', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay-modern/test.js',
      ...code(`
        const a = graphql\`
          fragment Test on Player {
            id
            ...
          #----^
          }
        \`
      `),
      otherFiles: {
        'relay-modern/test2.js': `
          const c = graphql\`
            fragment ProfileC on Player {
              id
            }
          \`
        `,
      },
    });
    expect(hints).toMatchInlineSnapshot(`
      Array [
        Object {
          "description": "fragment ProfileC on Player",
          "text": "ProfileC",
          "type": "Player",
        },
      ]
    `);
  });
});

describe('meta field __typename', () => {
  it('interface type', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment on Node {
            id
            __type
          #-------^
          afr
        \`
      `),
    });
    expect(hints).toContainEqual(allHints.TypeNameMetaField[0]);
  });

  it('union type', async () => {
    const hints = await autocomplete({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment on Entity {
            __type
          #-------^
          }
        \`
      `),
    });
    expect(hints).toContainEqual(allHints.TypeNameMetaField[0]);
  });
});

describe('meta field __schema', () => {
  test('Query', async () => {
    const hints = await autocomplete({
      sourcePath: 'query/test.graphql',
      ...code(`
        query {
          __
      #---^
        }
      `),
    });
    expect(hints).toContainEqual(allHints.SchemaMetaField[0]);
  });
});

describe('meta field __type', () => {
  test('Query', async () => {
    const hints = await autocomplete({
      sourcePath: 'query/test.graphql',
      ...code(`
        query {
          __
      #---^
        }
      `),
    });
    expect(hints).toContainEqual(allHints.TypeMetaField[0]);
  });
});

describe('[Bug] should work if position is first character', () => {
  it('whitespace', async () => {
    const hints = await autocomplete({
      sourcePath: 'query/test.graphql',
      sourceText: ' ',
      position: { line: 1, column: 1 },
    });
    expect(hints).toEqual(allHints.DocumentLevel);
  });

  it('mutation keyword', async () => {
    const hints = await autocomplete({
      sourcePath: 'query/test.graphql',
      sourceText: 'mutation',
      position: { line: 1, column: 1 },
    });
    expect(hints).toEqual([
      {
        description: 'Mutation contains all allowed mutations',
        text: 'mutation',
        type: 'Mutation',
      },
    ]);
  });

  it('fragment keyword', async () => {
    const hints = await autocomplete({
      sourcePath: 'query/test.graphql',
      sourceText: 'fragment',
      position: { line: 1, column: 1 },
    });
    expect(hints).toEqual([{ text: 'fragment' }]);
  });
});

test('[Bug] works correctly when sourceText contains CRLF', async () => {
  const hints = await autocomplete({
    sourcePath: 'relay/test.js',
    ...code(
      replaceLineEndings(
        `
        const a = Relay.QL\`
          fragment test on Node {
            id
            ...on   #
            ------^
          }
        \`;
      `,
        LINE_ENDING.crlf,
      ),
    ),
  });
  expect(hints).toEqual(allHints.TypesImplementsNode);
});

test('[Bug] should work with empty sourceText', async () => {
  const hints = await autocomplete({
    sourcePath: 'query/test.graphql',
    sourceText: '',
    position: { line: 1, column: 1 },
  });
  expect(hints).toEqual(allHints.DocumentLevel);
});
