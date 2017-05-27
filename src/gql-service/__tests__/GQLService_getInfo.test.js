/* @flow */
import code from 'gql-test-utils/code';
import path from 'path';
import { getSchemaFiles, getAllInfo } from 'gql-test-utils/test-data';
import { createTempFiles } from 'gql-test-utils/file';
import { type GQLPosition } from 'gql-shared/types';
import GQLService from '../GQLService';

describe('Schema: getDef', () => {
  it('works in schema files', async () => {
    const dir = createTempFiles({
      '.gqlconfig': `
        {
          schema: {
            files: 'schema/*.gql',
          }
        }
      `,
      'schema/schema.gql': `
        type Query {
          viewer: Viewer
        }

        type Viewer {
          name: string
        }
      `,
    });

    const gql = new GQLService({
      configDir: dir,
      watch: false,
    });

    gql.onError(err => {
      throw err;
    });

    await gql.start();

    expect(
      gql.getInfo({
        sourcePath: path.join(dir, 'schema/user.gql'),
        ...code(`
          type User {
            viewer: Viewer
            #---------^
          }
        `),
      }),
    ).toMatchSnapshot();
  });

  it('should not throw if called before onInit', () => {
    const dir = createTempFiles({
      '.gqlconfig': `
        {
          schema: {
            files: 'schema/*.gql',
          }
        }
      `,
      'schema/schema.gql': `
        type Query {
          viewer: Viewer
        }

        type Viewer {
          name: string
        }
      `,
    });

    const gql = new GQLService({
      configDir: dir,
      watch: false,
    });

    gql.onError(err => {
      throw err;
    });

    const run = () =>
      gql.getInfo({
        sourcePath: path.join(dir, 'schema/user.gql'),
        ...code(`
          type User {
            viewer: Viewer
            #---------^
          }
        `),
      });

    expect(run).not.toThrow();
    expect(run()).toBe(null);
  });
});

const allInfo = getAllInfo();

describe('Schema', () => {
  test('field type: ObjectType', async () => {
    const info = await getInfo({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test {
          field: Player,
          #--------^
        }
      `),
    });
    expect(info).toEqual(allInfo.PlayerType);
  });

  test('field type: Enum', async () => {
    const info = await getInfo({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test {
          field: Role,
            #-----^
        }
      `),
    });
    expect(info).toEqual(allInfo.RoleEnum);
  });

  test('field type: CustomScalar', async () => {
    const info = await getInfo({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test {
          field: CustomScalar,
            #--------^
        }
      `),
    });
    expect(info).toEqual(allInfo.CustomScalar);
  });

  test('union type', async () => {
    const info = await getInfo({
      sourcePath: 'schema/test.graphql',
      ...code(`
        union Test = Player | NewPlayer;
          #------------^
      `),
    });
    expect(info).toEqual(allInfo.PlayerType);
  });

  test('arguments', async () => {
    const info = await getInfo({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test {
          test(a: CustomScalar): string
            #--------^
        }
      `),
    });
    expect(info).toEqual(allInfo.CustomScalar);
  });

  test('implements', async () => {
    const info = await getInfo({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test implements Node {
                      #-------^
          test: string
        }
      `),
    });
    expect(info).toEqual(allInfo.NodeInterface);
  });

  test('core types', async () => {
    const info = await getInfo({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test {
          name: String
          #-------^
        }
      `),
    });
    expect(info).toEqual(allInfo.String);
  });

  test('unknown type', async () => {
    const info = await getInfo({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test implements Node {
          test: xString
          #-------^
        }
      `),
    });
    expect(info).toEqual(null);
  });
});

describe('Query', () => {
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
      expect(info).toEqual(allInfo.PlayerType);
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
      expect(info).toEqual(allInfo.NewPlayerFriendField);
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
      expect(info).toEqual(allInfo.PlayerImageSizeArg);
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
      expect(info).toEqual(allInfo.Mutation);
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
      expect(info).toEqual(allInfo.MutationPlayerCreate);
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
      expect(info).toEqual(allInfo.PlayerCreateInputRoleField);
    });

    it('variable definition type', async () => {
      const info = await getInfo({
        sourcePath: 'query/test.graphql',
        ...code(`
          mutation PlayerCreate($input: PlayerCreateInput)
                          #----------------^
        `),
      });
      expect(info).toEqual(allInfo.PlayerCreateInput);
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
      expect(info).toEqual(allInfo.Query);
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
      expect(info).toEqual(allInfo.QueryViewerField);
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
      expect(info).toEqual(allInfo.Subscription);
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
      expect(info).toEqual(allInfo.SubscriptionLikeStoryField);
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
      expect(info).toEqual(allInfo.LikeStorySubscriptionInputIdField);
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
      expect(info).toEqual(allInfo.IncludeDirective);
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
      expect(info).toEqual(allInfo.IncludeDirectiveIfArg);
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
      expect(info).toEqual(allInfo.CustomDirective);
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
      expect(info).toEqual(allInfo.CustomDirectiveIfArg);
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
      expect(info).toEqual(null);
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
      expect(info).toEqual(null);
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
      expect(info).toEqual(null);
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
      expect(info).toMatchSnapshot();
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
      expect(info).toMatchSnapshot();
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
      expect(info).toMatchSnapshot();
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
        expect(info).toEqual(allInfo.TypeNameMeta);
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
        expect(info).toEqual(allInfo.TypeNameMeta);
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
        expect(info).toEqual(allInfo.TypeNameMeta);
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
      expect(info).toMatchSnapshot();
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
      expect(info).toMatchSnapshot();
    });
  });
});

async function getInfo(opts: {
  sourceText: string,
  sourcePath: string,
  position: GQLPosition,
  otherFiles?: { [name: string]: string },
}) {
  const rootDir = createTempFiles({
    '.gqlconfig': `
        {
          schema: {
            files: ['schema/*.gql', 'schema/*.graphql'],
            graphQLOptions: {
              commentDescriptions: true
            },
          },
          query: {
            files: [
              {
                match: ['query/**/*.graphql', 'query/**/*.gql'],
              },
              {
                match: 'relay/**/*.js',
                presets: ['relay'],
              },
              {
                match: 'relay-modern/**/*.js',
                presets: ['relay-modern'],
              },
              {
                match: 'apollo/**/*.js',
                presets: ['apollo'],
              },
            ]
          }
        }
      `,
    ...getSchemaFiles(),
    [opts.sourcePath]: opts.sourceText,
    ...opts.otherFiles,
  });

  const gql = new GQLService({
    configDir: rootDir,
    watch: false,
  });
  gql.onError(err => {
    throw err;
  });

  await gql.start();

  const result = gql.getInfo({
    sourcePath: path.join(rootDir, opts.sourcePath),
    sourceText: opts.sourceText,
    position: opts.position,
  });

  await gql.stop();

  return result;
}
