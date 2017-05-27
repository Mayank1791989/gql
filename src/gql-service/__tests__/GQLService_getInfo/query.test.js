/* @flow */
import code from 'gql-test-utils/code';
import { LINE_ENDING, replaceLineEndings } from 'gql-shared/text';
import { getInfo, allInfo } from './utils';

describe('fragments', () => {
  it('on Type', async () => {
    const info = await getInfo({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
                #-----------^
            id
          }
        \`
      `),
    });
    expect(info).toEqual([allInfo.PlayerType]);
  });

  it('field: Should Include description, fieldDefn and output Type', async () => {
    const info = await getInfo({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on NewPlayer {
            friend
            #--^
          }
        \`
      `),
    });
    expect(info).toEqual([allInfo.NewPlayerFriendField]);
  });

  it('field arguments', async () => {
    const info = await getInfo({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
            image(size
              #----^
          }
        \`
      `),
    });
    expect(info).toEqual([allInfo.PlayerImageSizeArg]);
  });
});

describe('mutations', () => {
  it('type: include description', async () => {
    const info = await getInfo({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          mutation {
          #--^
          }
        \`
      `),
    });
    expect(info).toEqual([allInfo.Mutation]);
  });

  it('field: Include both input and output type', async () => {
    const info = await getInfo({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          mutation {
            PlayerCreate
            #-----^
          }
        \`
      `),
    });
    expect(info).toEqual([allInfo.MutationPlayerCreate]);
  });

  it('input object fields', async () => {
    const info = await getInfo({
      sourcePath: 'query/mutation.gql',
      ...code(`
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
      `),
    });
    expect(info).toEqual([allInfo.PlayerCreateInputRoleField]);
  });

  it('variable definition type', async () => {
    const info = await getInfo({
      sourcePath: 'query/test.graphql',
      ...code(`
        mutation PlayerCreate($input: PlayerCreateInput)
                        #----------------^
      `),
    });
    expect(info).toEqual([allInfo.PlayerCreateInput]);
  });
});

describe('query', () => {
  it('query keyword', async () => {
    const info = await getInfo({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          query Viewer { viewer }
          #--^
        \`
      `),
    });
    expect(info).toEqual([allInfo.Query]);
  });

  it('field', async () => {
    const info = await getInfo({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          query Viewer { viewer }
                #-----------^
        \`
      `),
    });
    expect(info).toEqual([allInfo.QueryViewerField]);
  });
});

describe('subscriptions', () => {
  it('type: include description', async () => {
    const info = await getInfo({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          subscription {
        #-----^
          }
        \`
      `),
    });
    expect(info).toEqual([allInfo.Subscription]);
  });

  it('field: Include both input and output type', async () => {
    const info = await getInfo({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          subscription {
            LikeStory
            #-----^
          }
        \`
      `),
    });
    expect(info).toEqual([allInfo.SubscriptionLikeStoryField]);
  });

  it('input object fields', async () => {
    const info = await getInfo({
      sourcePath: 'query/test.graphql',
      ...code(`
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
      `),
    });
    expect(info).toEqual([allInfo.LikeStorySubscriptionInputIdField]);
  });
});

describe('directives', () => {
  it('core: name', async () => {
    const info = await getInfo({
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
    expect(info).toEqual([allInfo.IncludeDirective]);
  });

  it('core: args', async () => {
    const info = await getInfo({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
            image @include(if: true)
                    #-------^
          }
        \`
      `),
    });
    expect(info).toEqual([allInfo.IncludeDirectiveIfArg]);
  });

  it('user defined: name', async () => {
    const info = await getInfo({
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
    expect(info).toEqual([allInfo.CustomDirective]);
  });

  it('user defined: args', async () => {
    const info = await getInfo({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          fragment test on Player {
            image @customDirective(if: true)
                            #------^
          }
        \`
      `),
    });
    expect(info).toEqual([allInfo.CustomDirectiveIfArg]);
  });

  it('unknown: name', async () => {
    const info = await getInfo({
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
    expect(info).toEqual([]);
  });

  it('unknown directive: args', async () => {
    const info = await getInfo({
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
    expect(info).toEqual([]);
  });

  it('known directive: unknown args', async () => {
    const info = await getInfo({
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
    expect(info).toEqual([]);
  });
});

describe('fragmentSpread', () => {
  it('fragment defined in same document', async () => {
    const info = await getInfo({
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
    expect(info).toMatchInlineSnapshot(`
      Array [
        Object {
          "contents": Array [
            "fragment Profile on Player ",
          ],
        },
      ]
    `);
  });

  it('fragment defined in same file', async () => {
    const info = await getInfo({
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
    expect(info).toMatchInlineSnapshot(`
      Array [
        Object {
          "contents": Array [
            "fragment Profile on Player ",
          ],
        },
      ]
    `);
  });

  it('fragment defined in other file', async () => {
    const info = await getInfo({
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
    expect(info).toMatchInlineSnapshot(`
      Array [
        Object {
          "contents": Array [
            "fragment Profile on Player {
          id
        }",
          ],
        },
      ]
    `);
  });
});

describe('meta field', () => {
  describe('__typename', () => {
    it('when inside Object Type', async () => {
      const info = await getInfo({
        sourcePath: 'relay/test.js',
        ...code(`
          const a = Relay.QL\`
            fragment on Viewer {
              __typename
              #----^
            }
          \`
        `),
      });
      expect(info).toEqual([allInfo.TypeNameMeta]);
    });

    it('when inside Interface Type', async () => {
      const info = await getInfo({
        sourcePath: 'relay/test.js',
        ...code(`
          const a = Relay.QL\`
            fragment on Node {
              __typename
              #----^
            }
          \`
        `),
      });
      expect(info).toEqual([allInfo.TypeNameMeta]);
    });

    it('when inside Union Type', async () => {
      const info = await getInfo({
        sourcePath: 'relay/test.js',
        ...code(`
          const a = Relay.QL\`
            fragment on Entity {
              __typename
              #----^
            }
          \`
        `),
      });
      expect(info).toEqual([allInfo.TypeNameMeta]);
    });
  });

  test('__schema', async () => {
    const info = await getInfo({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          query Viewer {
            __schema
            #----^
          }
        \`
      `),
    });

    expect(info).toEqual([allInfo.SchemaMeta]);
  });

  test('__type', async () => {
    const info = await getInfo({
      sourcePath: 'relay/test.js',
      ...code(`
        const a = Relay.QL\`
          query Viewer {
            __type
            #--^
          }
        \`
      `),
    });
    expect(info).toEqual([allInfo.TypeMeta]);
  });
});

test('[Bug] works when text contains CRLF', async () => {
  const info = await getInfo({
    sourcePath: 'relay/test.js',
    ...code(
      replaceLineEndings(
        `
          const a = Relay.QL\`
            fragment test on Player {
              image(size
                #----^
            }
          \`
        `,
        LINE_ENDING.crlf,
      ),
    ),
  });
  expect(info).toEqual([allInfo.PlayerImageSizeArg]);
});
