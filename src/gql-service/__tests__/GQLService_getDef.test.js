/* @flow */
import code from 'gql-test-utils/code';
import path from 'path';
import { getSchemaFiles, getDefLocations } from 'gql-test-utils/test-data';
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
      gql.getDef({
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

  it('works in schema files', () => {
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
      gql.getDef({
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

describe('Query: getDef', () => {
  it('works in query files', async () => {
    const dir = createTempFiles({
      '.gqlconfig': `
        {
          schema: {
            files: 'schema/*.gql',
          },
          query: {
            files: [
              {
                match: 'query/*.gql',
              },
            ]
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
      gql.getDef({
        sourcePath: path.join(dir, 'query/user.gql'),
        ...code(`
          fragment test on Viewer {
              #-------------^
            name
          }
        `),
      }),
    ).toMatchSnapshot();
  });
});

describe('Schema', () => {
  test('field type: ObjectType', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test {
          field: Player,
            #------^
        }
      `),
    });
    expect(def).toEqual(defLocations.Player);
  });

  test('field type: Enum', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test {
          field: Role,
            #-----^
        }
      `),
    });
    expect(def).toEqual(defLocations.Role);
  });

  test('field type: CustomScalar', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test {
          field: CustomScalar,
            #---------^
        }
      `),
    });
    expect(def).toEqual(defLocations.CustomScalar);
  });

  test('field type: Core Scalars', async () => {
    const { def } = await getDef({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test {
          field: String,
            #------^
        }
      `),
    });
    expect(def).toEqual(null);
  });

  test('union type', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'schema/test.graphql',
      ...code(`
        union Test = Player | NewPlayer;
            #----------^
      `),
    });
    expect(def).toEqual(defLocations.Player);
  });

  test('unknown type', async () => {
    const { def } = await getDef({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test {
          field: xString,
            #------^
        }
      `),
    });
    expect(def).toEqual(null);
  });

  test('arguments', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test {
          test(a: CustomScalar): string
            #-----------^
        }
      `),
    });
    expect(def).toEqual(defLocations.CustomScalar);
  });

  test('implements', async () => {
    const { defLocations, def } = await getDef({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type Test implements Node {
                  #-----------^
          test: string
        }
      `),
    });
    expect(def).toEqual(defLocations.Node);
  });
});

describe('Query', () => {
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

      expect(def).toEqual(defLocations.Player);
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
      expect(def).toEqual(defLocations.Player_id);
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
      expect(def).toEqual(defLocations.Player_image_arg_size);
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
      expect(def).toEqual(defLocations.Player);
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

      expect(def).toEqual(defLocations.Player_id);
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
      expect(def).toEqual(defLocations.Player);
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
      expect(def).toEqual(defLocations.Player);
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
      expect(def).toEqual(defLocations.Mutation);
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
      expect(def).toEqual(defLocations.Mutation_PlayerCreate);
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
      expect(def).toEqual(defLocations.Mutation_PlayerCreateInput_id);
    });

    it('variable definition type', async () => {
      const { defLocations, def } = await getDef({
        sourcePath: 'query/test.graphql',
        ...code(`
          mutation PlayerCreate($input: PlayerCreateInput)
                          #----------------^
        `),
      });
      expect(def).toEqual(defLocations.Mutation_PlayerCreateInput);
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
      expect(def).toEqual(defLocations.Query);
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
      expect(def).toEqual(defLocations.Query_viewer);
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
      expect(def).toEqual(defLocations.Subscription);
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
      expect(def).toEqual(defLocations.Subscription_LikeStory);
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
      expect(def).toEqual(
        defLocations.Subscription_LikeStorySubscriptionInput_id,
      );
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
      expect(def).toEqual(null);
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
      expect(def).toEqual(null);
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
      expect(def).toEqual(defLocations.customDirective);
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
      expect(def).toEqual(defLocations.customDirective_argIf);
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
      expect(def).toEqual(null);
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
      expect(def).toEqual(null);
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
      expect(def).toEqual(null);
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
      expect(def).toMatchSnapshot();
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
      expect(def).toMatchSnapshot();
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
      expect(def).toMatchSnapshot();
    });
  });
});

async function getDef(opts: {
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
              {
                match: 'custom/**/*.xyz',
                parser: [
                  'embedded-queries',
                  {
                    start: '"""',
                    end: '"""',
                  }
                ],
                presets: ['default'],
              }
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

  const def = gql.getDef({
    sourcePath: path.join(rootDir, opts.sourcePath),
    sourceText: opts.sourceText,
    position: opts.position,
  });

  const defLocations = getDefLocations(rootDir);

  await gql.stop();

  return { defLocations, def };
}
