/* @flow */
import code from 'gql-test-utils/code';
import { getDef } from './utils';

describe('fragments', () => {
  it('on Type', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
            #----------------^
          }
        \`
      `),
    });

    expect(def).toEqual([defLocations.Player]);
  });

  it('field', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
            id
          #--^
          }
        \`
      `),
    });
    expect(def).toEqual([defLocations.Player_id]);
  });

  it('field arguments', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
            image(size
              #-----^
          }
        \`
      `),
    });
    expect(def).toEqual([defLocations.Player_image_arg_size]);
  });

  it('should work in custom files', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'custom/test.xyz',
      ...code(`
        """
        fragment test on Player {
                  #--------^
          id
        }
        """
      `),
    });
    expect(def).toEqual([defLocations.Player]);
  });

  it('should work with multiple Relay.QL', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
            id
          }
        \`);

        const b = Relay.QL\`
          fragment test2 on Player {
            id
          #--^
          }
        \`);
      `),
    });

    expect(def).toEqual([defLocations.Player_id]);
  });

  it('should work in simple gql files', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'query/test.graphql',
      ...code(`
        fragment test on Player {
                    #-------^
          id
        }
      `),
    });
    expect(def).toEqual([defLocations.Player]);
  });

  it('should work in custom files', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'custom/test.xyz',
      ...code(`
        """
        fragment test on Player {
                  #--------^
          id
        }
        """
      `),
    });
    expect(def).toEqual([defLocations.Player]);
  });
});

describe('mutations', () => {
  it('mutation keyword', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          mutation { PlayerCreate }
          #--^
        \`
      `),
    });
    expect(def).toEqual([defLocations.Mutation]);
  });

  it('field', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          mutation { PlayerCreate }
                #----------^
        \`
      `),
    });
    expect(def).toEqual([defLocations.Mutation_PlayerCreate]);
  });

  it('input object fields', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'query/test.graphql',
      ...code(`
        mutation {
          PlayerCreate(
            input: {
              id: "some_id",
          #----^
              name: "some_name",
            }
          ) {
            player { id }
          }
        }
      `),
    });
    expect(def).toEqual([defLocations.Mutation_PlayerCreateInput_id]);
  });

  it('variable definition type', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'query/test.graphql',
      ...code(`
        mutation PlayerCreate($input: PlayerCreateInput)
                        #----------------^
      `),
    });
    expect(def).toEqual([defLocations.Mutation_PlayerCreateInput]);
  });
});

describe('query', () => {
  it('query keyword', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          query Viewer { viewer }
        #--^
        \`
      `),
    });
    expect(def).toEqual([defLocations.Query]);
  });
  it('field', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          query Viewer { viewer }
                #-----------^
        \`
      `),
    });
    expect(def).toEqual([defLocations.Query_viewer]);
  });
});

describe('subscriptions', () => {
  it('subscription keyword', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          subscription { LikeStory }
          #--^
        \`
      `),
    });
    expect(def).toEqual([defLocations.Subscription]);
  });

  it('field', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          subscription { LikeStory }
                #----------^
        \`
      `),
    });
    expect(def).toEqual([defLocations.Subscription_LikeStory]);
  });

  it('input object fields', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'query/test.graphql',
      ...code(`
        subscription {
          LikeStory(
            input: {
              id: "some_id",
          #----^
            }
          ) {
            clientSubscriptionId
          }
        }
      `),
    });
    expect(def).toEqual([
      defLocations.Subscription_LikeStorySubscriptionInput_id,
    ]);
  });
});

describe('directives', () => {
  it('core: name', async () => {
    const { def } = await getDef({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
            image @include(if: true)
              #--------^
          }
        \`
      `),
    });
    expect(def).toEqual([]);
  });

  it('core: args', async () => {
    const { def } = await getDef({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
            image @include(if: true)
                  #--------^
          }
        \`
      `),
    });
    expect(def).toEqual([]);
  });

  it('user defined: name', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
            image @customDirective(if: true)
              #-------^
          }
        \`
      `),
    });
    expect(def).toEqual([defLocations.customDirective]);
  });

  it('user defined: args', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
            image @customDirective(if: true)
                            #-------^
          }
        \`
      `),
    });
    expect(def).toEqual([defLocations.customDirective_argIf]);
  });

  it('unknown: name', async () => {
    const { def } = await getDef({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
            image @xyzeagder(if: true)
              #-------^
          }
        \`
      `),
    });
    expect(def).toEqual([]);
  });

  it('unknown directive: args', async () => {
    const { def } = await getDef({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
            image @xyzeagder(if: true)
                      #-------^
          }
        \`
      `),
    });
    expect(def).toEqual([]);
  });

  it('known directive: unknown args', async () => {
    const { def } = await getDef({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
            image @include(ifs: true)
                    #-------^
          }
        \`
      `),
    });
    expect(def).toEqual([]);
  });
});

describe('fragmentSpread', () => {
  it('fragment defined in same document', async () => {
    const { def } = await getDef({
      sourcePath: 'relay-modern/test.js',
      ...code(`
        const a = graphql\`
          fragment test on Player {
              ...Profile
          #-------^
          }

          fragment Profile on Player {
            id
            name
          }
        \`
      `),
    });
    expect(def).toMatchInlineSnapshot(`
      Array [
        Object {
          "end": Object {
            "column": 30,
            "line": 7,
          },
          "path": "$ROOT_DIR/relay-modern/test.js",
          "start": Object {
            "column": 3,
            "line": 7,
          },
        },
      ]
    `);
  });

  it('fragment defined in same file', async () => {
    const { def } = await getDef({
      sourcePath: 'relay-modern/test.js',
      ...code(`
        const test = graphql\`
          fragment Profile on Player {
            id
            name
          }
        \`

        const a = graphql\`
          fragment test on Player {
            id
            ...Profile
        #--------^
          }
        \`
      `),
    });
    expect(def).toMatchInlineSnapshot(`
      Array [
        Object {
          "end": Object {
            "column": 30,
            "line": 2,
          },
          "path": "$ROOT_DIR/relay-modern/test.js",
          "start": Object {
            "column": 3,
            "line": 2,
          },
        },
      ]
    `);
  });

  it('fragment defined in other file', async () => {
    const { def } = await getDef({
      sourcePath: 'relay-modern/test.js',
      ...code(`
        const a = graphql\`
          fragment test on Player {
            ...Profile
          #-----^
          }
        \`
      `),
      otherFiles: {
        'relay-modern/test2.js': `
          const b = graphql\`
            fragment Profile on Player {
              id
            }
          \`
        `,
      },
    });
    expect(def).toMatchInlineSnapshot(`
      Array [
        Object {
          "end": Object {
            "column": 4,
            "line": 4,
          },
          "path": "$ROOT_DIR/relay-modern/test2.js",
          "start": Object {
            "column": 3,
            "line": 2,
          },
        },
      ]
    `);
  });
});
