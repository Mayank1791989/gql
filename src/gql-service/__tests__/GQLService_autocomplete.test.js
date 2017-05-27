/* @flow */
import code from 'gql-test-utils/code';
import GQLService from '../GQLService';
import { getSchemaFiles, getHints, sortHints } from 'gql-test-utils/test-data';
import { createTempFiles } from 'gql-test-utils/file';
import path from 'path';

describe('Schema: autocomplete', () => {
  it('works in schema files', async () => {
    const rootPath = createTempFiles({
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
            name: String
          }
        `,
    });

    const gql = new GQLService({
      configDir: rootPath,
      watch: false,
    });
    gql.onError(err => {
      throw err;
    });

    await gql.start();

    expect(
      gql
        .autocomplete({
          sourcePath: path.join(rootPath, 'schema/user.gql'),
          ...code(`
            type User {
              viewer: Vi
              #---------^
            }
        `),
        })
        .sort(sortHints),
    ).toMatchSnapshot();
  });

  it('should not throw if called before server started', () => {
    const gql = new GQLService({
      configDir: createTempFiles({
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
            name: String
          }
        `,
      }),
      watch: false,
    });

    const run = () =>
      gql.autocomplete({
        sourcePath: 'schema/user.gql',
        ...code(`
        type User {
          viewer: Vi
          #---------^
        }
      `),
      });

    expect(run).not.toThrow();
    expect(run()).toEqual([]);
  });
});

const allHints = getHints();

describe('Schema', () => {
  describe('type', () => {
    it('show all types for Field', async () => {
      const hints = await autocomplete({
        sourcePath: 'schema/test.graphql',
        ...code(`
          type TestType {
            name:   #
            #-----^
          }
        `),
      });
      expect(hints).toEqual(allHints.OutputTypes);
    });

    it('show all types for Field even after typing few chars', async () => {
      const hints = await autocomplete({
        sourcePath: 'schema/test.graphql',
        ...code(`
          type TestType {
            name: S  #
            #------^
          }
        `),
      });
      expect(hints).toEqual(allHints.OutputTypes);
    });

    it('show all output types for Field if cursor on ! and of the form T!', async () => {
      const hints = await autocomplete({
        sourcePath: 'schema/test.graphql',
        ...code(`
          type TestType {
            name: S!   ##
            #-------^
          }
        `),
      });
      expect(hints).toEqual(allHints.OutputTypes);
    });

    it('show all output types for Field if cursor on ] and of type [T]', async () => {
      const hints = await autocomplete({
        sourcePath: 'schema/test.graphql',
        ...code(`
          type TestType {
            name: [S] #
            #-------^
          }
        `),
      });
      expect(hints).toEqual(allHints.OutputTypes);
    });

    it('show all output types for Field if cursor on ! and of the form [T!]', async () => {
      const hints = await autocomplete({
        sourcePath: 'schema/test.graphql',
        ...code(`
          type TestType {
            name: [S!]
            #-------^
          }
        `),
      });
      expect(hints).toEqual(allHints.OutputTypes);
    });

    it('dont show any types for Field if cursor after !', async () => {
      const hints = await autocomplete({
        sourcePath: 'schema/test.graphql',
        ...code(`
          type TestType {
            name: S!  #
            #--------^
          }
        `),
      });
      expect(hints).toEqual([]);
    });

    it('show all types for Field with args', async () => {
      const hints = await autocomplete({
        sourcePath: 'schema/test.graphql',
        ...code(`
          type TestType {
            players(first: String!):   #
                            #--------^
          }
        `),
      });
      expect(hints).toEqual(allHints.OutputTypes);
    });

    it('show all types for Field ListType', async () => {
      const hints = await autocomplete({
        sourcePath: 'schema/test.graphql',
        ...code(`
          type TestType {
            name: []
            #-----^ (inside bracket)
          }
        `),
      });
      expect(hints).toEqual(allHints.OutputTypes);
    });

    it('show only InputType for Field input args ', async () => {
      const hints = await autocomplete({
        sourcePath: 'schema/test.graphql',
        ...code(`
          type TestType {
            name(xyz: )
            #--------^
          }
        `),
      });
      expect(hints).toEqual(allHints.InputTypes);
    });

    it('show `implements` && `{` after typename', async () => {
      const hints = await autocomplete({
        sourcePath: 'schema/test.graphql',
        ...code(`
          type TestType   #
          #-------------^
        `),
      });
      expect(hints).toMatchSnapshot();
    });

    it('show all `GraphQLInterfaceType` types after `implements` keyword', async () => {
      const hints = await autocomplete({
        sourcePath: 'schema/test.graphql',
        ...code(`
          type TestType implements   # (Dont remove hash will avoid removing space after line)
          #------------------------^
        `),
      });
      expect(hints).toEqual(allHints.InterfaceTypes);
    });

    it('show all `GraphQLInterfaceType` types after multiple InterfaceTypes', async () => {
      const hints = await autocomplete({
        sourcePath: 'schema/test.graphql',
        ...code(`
          type TestType implements Node   #
                #-----------------------^
        `),
      });
      expect(hints).toEqual(allHints.InterfaceTypes);
    });
  });

  describe('input', () => {
    it('show only InputType for field', async () => {
      const hints = await autocomplete({
        sourcePath: 'schema/test.graphql',
        ...code(`
          input TestTypeInput {
            name:   #
            ------^
          }
        `),
      });
      expect(hints).toEqual(allHints.InputTypes);
    });

    it('show only InputType for field of ListType', async () => {
      const hints = await autocomplete({
        sourcePath: 'schema/test.graphql',
        ...code(`
          input TestType {
            name: []
            ------^ (inside bracket)
          }
        `),
      });
      expect(hints).toEqual(allHints.InputTypes);
    });
  });

  describe('union', () => {
    it('show only GrahQLObjectType for field', async () => {
      const hints = await autocomplete({
        sourcePath: 'schema/test.graphql',
        ...code(`
          union TestUnionType =   #
              #-----------------^
        `),
      });
      expect(hints).toEqual(allHints.ObjectTypes);
    });

    it('show all GrahQLObjectType after `|`', async () => {
      const hints = await autocomplete({
        sourcePath: 'schema/test.graphql',
        ...code(`
          union TestUnionType =  TestType |   #
                        #-------------------^
        `),
      });
      expect(hints).toEqual(allHints.ObjectTypes);
    });
  });
});

describe('Query', () => {
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
      expect(hints).toMatchSnapshot();
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
      expect(hints).toMatchSnapshot();
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
      expect(hints).toMatchSnapshot();
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
      expect(hints).toMatchSnapshot();
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
      expect(hints).toMatchSnapshot();
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
      expect(hints).toMatchSnapshot();
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
      expect(hints).toMatchSnapshot();
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
      expect(hints).toMatchSnapshot();
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
      expect(hints).toMatchSnapshot();
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
            }
          \`
        `),
      });
      expect(hints).toContainEqual(allHints.TypeNameMetaField);
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
      expect(hints).toContainEqual(allHints.TypeNameMetaField);
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
      expect(hints).toContainEqual(allHints.SchemaMetaField);
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
      expect(hints).toContainEqual(allHints.TypeMetaField);
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
      expect(hints).toMatchSnapshot();
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

  test('[Bug] should work with empty sourceText', async () => {
    const hints = await autocomplete({
      sourcePath: 'query/test.graphql',
      sourceText: '',
      position: { line: 1, column: 1 },
    });
    expect(hints).toEqual(allHints.DocumentLevel);
  });
});

async function autocomplete(options: {
  sourcePath: string,
  sourceText: string,
  position: any,
  otherFiles?: Object,
}) {
  const rootDir = createTempFiles({
    '.gqlconfig': `
        {
          schema: {
            files: ['schema/*.gql', 'schema/**/*.graphql'],
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
    ...options.otherFiles,
  });

  const gql = new GQLService({
    configDir: rootDir,
    watch: false,
  });
  gql.onError(err => {
    throw err;
  });

  await gql.start();
  const result = gql
    .autocomplete({
      sourcePath: path.join(rootDir, options.sourcePath),
      sourceText: options.sourceText,
      position: options.position,
    })
    .sort(sortHints);
  await gql.stop();
  return result;
}
