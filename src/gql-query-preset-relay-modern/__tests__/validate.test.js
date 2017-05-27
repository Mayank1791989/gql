/* @flow */
import { createTempFiles } from 'gql-test-utils/file';
import { dedent } from 'dentist';
import GQLService from 'gql-service';

async function validateSource(
  source: string,
  otherFiles?: Object | null,
  rulesToDisable?: Array<string>,
): Promise<any> {
  const gql = new GQLService({
    configDir: createTempFiles({
      '.gqlconfig': JSON.stringify(
        {
          schema: {
            files: 'schema/*.gql',
            validate: {
              config: {
                NoUnusedTypeDefinition: 'off',
              },
            },
          },

          query: {
            files: [
              {
                match: 'query/*.js',
                presets: ['relay-modern'],
                ...(rulesToDisable
                  ? {
                      validate: {
                        config: rulesToDisable.reduce((acc, ruleName) => {
                          acc[ruleName] = 'off';
                          return acc;
                        }, {}),
                      },
                    }
                  : null),
              },
            ],
          },
        },
        null,
        2,
      ),

      'schema/schema.gql': `
        type Query {
          viewer: Viewer!
          mutation: Mutation!
        }

        type Viewer {
          id: ID!
          me: User!
        }

        type User {
          id: ID!
          name: String
          image(size: Int!): String
          friends(first: Int, last: Int, before: String, after: String): FriendConnection
        }

        type Mutation {
          UserCreate(input: UserCreateInput): UserCreatePayload
        }

        input UserCreateInput {
          id: ID!
          name: String!
        }

        type UserCreatePayload {
          userID: ID!
          viewer: Viewer!
        }

        type FriendConnection {
          pageInfo: PageInfo!
          edges: [FriendEdge]
        }

        type FriendEdge {
          node: User!
          cursor: String!
        }

        type PageInfo {
          hasNextPage: Boolean!
          hasPreviousPage: Boolean!
          startCursor: String
          endCursor: String
        }
      `,

      'query/test.js': dedent(source),
      ...otherFiles,
    }),

    watch: false,
  });

  gql.onError(err => {
    throw err;
  });

  await gql.start();

  return gql.status();
}

test('Rule: ExactlyOneOperation', async () => {
  const errors = await validateSource(`
    graphql\`
      query ExampleQuery {
        viewer {
          ...viewer
          me {
            name
          }
        }
      }

      fragment viewer on Viewer {
        me {
          name
        }
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

test('Rule: RequiredDefinitionName', async () => {
  const errors = await validateSource(`
    graphql\`
      query {
        viewer {
          id
        }
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

test('Rule: ExecutableDefinitions', async () => {
  const errors = await validateSource(`
    graphql\`
      type Tester {
        id: ID!
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

test('Rule: KnownTypeNames', async () => {
  const errors = await validateSource(`
    graphql\`
      fragment Test on XViewer {
        id
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

test('Rule: FragmentsOnCompositeTypes', async () => {
  const errors = await validateSource(`
    graphql\`
      fragment Test on Viewer {
        ...on String {
          id
        }
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

test('Rule: VariablesAreInputTypes', async () => {
  const errors = await validateSource(`
    graphql\`
      query Test($size: Viewer!) {
        viewer {
          me {
            image(size: $size)
          }
        }
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

test('Rule: VariablesDefaultValueAllowed', async () => {
  const errors = await validateSource(`
    graphql\`
      query Test($size: Int! = 5) {
        viewer {
          me {
            image(size: $size)
          }
        }
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

test('Rule: ScalarLeafs', async () => {
  const errors = await validateSource(`
    graphql\`
      query Test {
        viewer {
          me
        }
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

test('Rule: FieldsOnCorrectType', async () => {
  const errors = await validateSource(`
    graphql\`
      query Test {
        viewer {
          tester
        }
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

test('Rule: UniqueFragmentNames', async () => {
  const errors = await validateSource(`
    graphql\`
      fragment Test on User {
        id
      }

      fragment Test on User {
        name
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

test('Rule: UniqueVariableNames', async () => {
  const errors = await validateSource(`
    graphql\`
      query test($cond1: Boolean!, $cond1: Boolean!) {
        viewer {
          id @include(if: $cond1)
        }
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

describe('Rule: NoUndefinedVariables', () => {
  describe('fragments', () => {
    it('report undefined variables', async () => {
      const errors = await validateSource(`
        graphql\`
          fragment Test on User {
            id @include(if: $cond)
          }
        \`
      `);

      expect(errors).toMatchSnapshot();
    });

    it('should not report undefined variables if variables defined using @argumentDefinitions', async () => {
      const errors = await validateSource(`
        graphql\`
          fragment Test on User @argumentDefinitions(
            showID: { type: "Boolean!", defaultValue: true }
          ) {
            id @include(if: $showID)
          }
        \`
      `);

      expect(errors).toEqual([]);
    });
  });

  test('query', async () => {
    const errors = await validateSource(`
      graphql\`
        query test {
          viewer {
            id @include(if: $cond1)
          }
        }
      \`
    `);
    expect(errors).toMatchSnapshot();
  });
});

test('Rule: NoUnusedVariables', async () => {
  const errors = await validateSource(`
    graphql\`
      query test($cond1: Boolean!) {
        viewer {
          id
        }
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

test('Rule: UniqueDirectivesPerLocation', async () => {
  const errors = await validateSource(`
    graphql\`
      query test($cond1: Boolean!) {
        viewer {
          id @include(if: $cond1) @include(if: $cond1)
        }
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

describe('Rule: KnownArgumentsName', () => {
  it('field', async () => {
    const errors = await validateSource(`
      graphql\`
        fragment test on User {
          image(size: 10, sizes: 20)
        }
      \`
    `);
    expect(errors).toMatchSnapshot();
  });

  it('directive', async () => {
    const errors = await validateSource(`
      graphql\`
        query test($cond1: Boolean!) {
          viewer {
            id @include(if: true, ifss: $cond1)
          }
        }
      \`
    `);
    expect(errors).toMatchSnapshot();
  });
});

it('Rule: UniqueArgumentNames', async () => {
  const errors = await validateSource(`
    graphql\`
      fragment test on User {
        image(size: 10, size: 20)
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

it('Rule: ProvidedNonNullArguments', async () => {
  const errors = await validateSource(`
    graphql\`
      fragment test on User {
        image
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

it('Rule: ValuesOfCorrectType', async () => {
  const errors = await validateSource(`
    graphql\`
      fragment test on User {
        image(size: true)
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

it('Rule: UniqueInputFieldNames', async () => {
  const errors = await validateSource(`
    graphql\`
      mutation Test {
        UserCreate(input: {
          id: "id_1",
          name: "name",
          id: "id_2",
        }) {
          userID
        }
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

describe('Rule: KnownFragmentNames', () => {
  it('report missing fragments', async () => {
    const errors = await validateSource(
      `
        graphql\`
          fragment Test on User {
            ...SomeUnknownFragment
          }
        \`
      `,
    );
    expect(errors).toMatchSnapshot();
  });

  it('not report if fragment defined in other files', async () => {
    const errors = await validateSource(
      `
      graphql\`
        fragment Test on User {
          ...UserFragmentInSomeOtherFile
        }
      \`
    `,
      {
        'query/some_other_files.js': `
          const a = graphql\`
            fragment UserFragmentInSomeOtherFile on User {
              name
            }
          \`,
        `,
      },
    );
    expect(errors).toEqual([]);
  });

  it('not report if fragment defined in same document', async () => {
    const errors = await validateSource(`
      graphql\`
        fragment Test on User {
          ...SomeFragment
        }

        fragment SomeFragment on User {
          id
        }
      \`
    `);
    expect(errors).toEqual([]);
  });

  it('not report if fragment defined in same file', async () => {
    const errors = await validateSource(`
      const a = graphql\`
        fragment Test on User {
          ...SomeFragment
        }
      \`;

      const b = graphql\`
        fragment SomeFragment on User {
          id
        }
      \`;
    `);
    expect(errors).toEqual([]);
  });
});

describe('Rule: KnownDirectives', () => {
  it('report unknown directives', async () => {
    const errors = await validateSource(`
      graphql\`
        fragment Test on User {
          id @some_directive
        }
      \`
    `);

    expect(errors).toMatchSnapshot();
  });

  it('@connection: should not report unknown', async () => {
    const errors = await validateSource(`
      graphql\`
        fragment Test on User {
          friends(first: 10) @connection(key: "some_key") {
            edges {
              node {
                id
              }
            }
          }
        }
      \`
    `);

    expect(errors).toEqual([]);
  });

  it('@argument: should not report unknown', async () => {
    const errors = await validateSource(
      `
        graphql\`
          fragment Test on User {
            ...tester @arguments(key: "some_key")
          }
        \`,
      `,
      null,
      ['KnownFragmentNames'],
    );

    expect(errors).toEqual([]);
  });
});

describe('ConnectionDirective', () => {
  it('report if not used on field of type Connection', async () => {
    const errors = await validateSource(`
      graphql\`
        fragment Test on Viewer {
          me @connection(key: "some_key") {
            id
          }
        }
      \`
    `);

    expect(errors).toMatchSnapshot();
  });

  it('not report if used on connection field', async () => {
    const errors = await validateSource(`
      graphql\`
        fragment Test on User {
          friends(first: 10) @connection(key: "some_key") {
            edges {
              node {
                id
              }
            }
          }
        }
      \`
    `);

    expect(errors).toEqual([]);
  });
});

describe('ArgumentDefinitionsDirective', () => {
  it('should not be reported as unknown', async () => {
    const errors = await validateSource(`
      graphql\`
        fragment Test on User @argumentDefinitions(
          name: { type: "Boolean!" },
        ){
          id @include(if: $name)
        }
      \`
    `);

    expect(errors).toEqual([]);
  });

  it('only allowed on FRAGMENT_DEFINITION', async () => {
    const errors = await validateSource(`
      graphql\`
        fragment Test on User {
          id @argumentDefinitions(name: { type: "String" })
        }
      \`
    `);

    expect(errors).toMatchSnapshot();
  });

  describe('arg defintion value', () => {
    it('should be of object type', async () => {
      const errors = await validateSource(`
        graphql\`
          fragment Test on User @argumentDefinitions(
            name: 10
          ) {
            id @include(if: $name)
          }
        \`
      `);

      expect(errors).toMatchSnapshot();
    });

    it('duplicate fields are not allowed', async () => {
      const errors = await validateSource(`
        graphql\`
          fragment Test on User @argumentDefinitions(
            name: { type: "Boolean!", defaultValue: true, type: "Boolean!" }
          ) {
            id @include(if: $name)
          }
        \`
      `);

      expect(errors).toMatchSnapshot();
    });

    it('unknown fields are not allowed', async () => {
      const errors = await validateSource(`
        graphql\`
          fragment Test on User @argumentDefinitions(
            name: { type: "Boolean!", xdefaultValue: {} }
          ) {
            id @include(if: $name)
          }
        \`
      `);

      expect(errors).toMatchSnapshot();
    });

    describe('field: "type"', () => {
      it('is required', async () => {
        const errors = await validateSource(`
          graphql\`
            fragment Test on User @argumentDefinitions(
              name: { defaultValue: 10 }
            ) {
              id @include(if: $name)
            }
          \`
        `);

        expect(errors).toMatchSnapshot();
      });

      it('value should be of type String!', async () => {
        const errors = await validateSource(`
          graphql\`
            fragment Test on User @argumentDefinitions(
              name: { type: 5 }
            ) {
              id @include(if: $name)
            }
          \`
        `);

        expect(errors).toMatchSnapshot();
      });

      it('value should not be of unknown type', async () => {
        const errors = await validateSource(`
          graphql\`
            fragment Test on User @argumentDefinitions(
              name: { type: "xString!" }
            ) {
              id @include(if: $name)
            }
          \`
        `);

        expect(errors).toMatchSnapshot();
      });

      it('value should be of input type', async () => {
        const errors = await validateSource(
          `
          graphql\`
            fragment Test on User @argumentDefinitions(
              name: { type: "Viewer!" }
            ) {
              id @include(if: $name)
            }
          \`
        `,
          null,
          ['VariablesInAllowedPosition'],
        );

        expect(errors).toMatchSnapshot();
      });
    });

    describe('field: "defaultValue"', () => {
      it('is optional', async () => {
        const errors = await validateSource(`
          graphql\`
            fragment Test on User @argumentDefinitions(
              name: { type: "Boolean!" }
            ) {
              id @include(if: $name)
            }
          \`
        `);

        expect(errors).toEqual([]);
      });

      it('value should be of type defined in field "type"', async () => {
        const errors = await validateSource(`
          graphql\`
            fragment Test on User @argumentDefinitions(
              name: { type: "Boolean!", defaultValue: { id: "tester" } }
            ) {
              id @include(if: $name)
            }
          \`
        `);

        expect(errors).toMatchSnapshot();
      });
    });
  });

  it('report unused arg definition', async () => {
    const errors = await validateSource(`
      graphql\`
        fragment Test on User @argumentDefinitions(
          name: { type: "String", defaultValue: "10" }
        ) {
          id
        }
      \`
    `);

    expect(errors).toMatchSnapshot();
  });
});

describe('ArgumentsDirective', () => {
  it('should report if not used on fragment_spread', async () => {
    const errors = await validateSource(`
      graphql\`
        fragment Test on User {
          id @arguments(if: true)
        }
      \`
    `);

    expect(errors).toMatchSnapshot();
  });

  it('should ignore if fragment spread fragment not found', async () => {
    const errors = await validateSource(
      `
        graphql\`
          fragment Test on User {
            ...SomeFragment @arguments(if: true)
          }
        \`
      `,
      null,
      ['KnownFragmentNames'],
    );

    expect(errors).toEqual([]);
  });

  it('should report if used on fragment not expecting arguments.', async () => {
    const errors = await validateSource(
      `
        graphql\`
          fragment Test on User {
            ...ProfileUser @arguments(if: true)
          }
        \`
      `,
      {
        'query/profile.js': `
          graphql\`
            fragment ProfileUser on User {
              name
            }
          \`
        `,
      },
    );

    expect(errors).toMatchSnapshot();
  });

  it('should report if not used and fragment expecting arguments.', async () => {
    const errors = await validateSource(
      `
        graphql\`
          fragment Test on User {
            ...ProfileUser
          }
        \`
      `,
      {
        'query/profile.js': `
          graphql\`
            fragment ProfileUser on User @argumentDefinitions(
              size: { type: "Int!" }
            ) {
              name
              image(size: $size)
            }
          \`
        `,
      },
    );

    expect(errors).toMatchSnapshot();
  });

  it('should report undefined variables in fragments', async () => {
    const errors = await validateSource(
      `
        graphql\`
          fragment Test on User {
            ...ProfileUser @arguments(size: $size)
          }
        \`
      `,
      {
        'query/profile.js': `
          graphql\`
            fragment ProfileUser on User @argumentDefinitions(
              size: { type: "Int!", defaultValue: 32 }
            ) {
              name
              image(size: $size)
            }
          \`
        `,
      },
    );

    expect(errors).toMatchSnapshot();
  });

  it('should report undefined variables in operations', async () => {
    const errors = await validateSource(
      `
        graphql\`
          query User {
            viewer {
              me {
                ...ProfileUser @arguments(size: $size)
              }
            }
          }
        \`
      `,
      {
        'query/profile.js': `
          graphql\`
            fragment ProfileUser on User @argumentDefinitions(
              size: { type: "Int!" }
            ) {
              name
              image(size: $size)
            }
          \`
        `,
      },
    );

    expect(errors).toMatchSnapshot();
  });

  it('should report UnknownArguments inside directive', async () => {
    const errors = await validateSource(
      `
        graphql\`
          query User($size: Int!) {
            viewer {
              me {
                ...ProfileUser @arguments(xsize: $size, size: $size)
              }
            }
          }
        \`
      `,
      {
        'query/profile.js': `
          graphql\`
            fragment ProfileUser on User @argumentDefinitions(
              size: { type: "Int!" }
            ) {
              name
              image(size: $size)
            }
          \`
        `,
      },
    );

    expect(errors).toMatchSnapshot();
  });

  it('should report MissingArgument inside directive', async () => {
    const errors = await validateSource(
      `
        graphql\`
          query User($size: Int!) {
            viewer {
              me {
                ...ProfileUser @arguments(small: $size)
              }
            }
          }
        \`
      `,
      {
        'query/profile.js': `
          graphql\`
            fragment ProfileUser on User @argumentDefinitions(
              small: { type: "Int!" }
              large: { type: "Int!" }
            ) {
              name
              small: image(size: $small)
              large: image(size: $large)
            }
          \`
        `,
      },
    );

    expect(errors).toMatchSnapshot();
  });
});

describe('Rule: VariablesInAllowedPosition', () => {
  test('query', async () => {
    const errors = await validateSource(`
      graphql\`
        query Test($size: String!) {
          viewer {
            me {
              image(size: $size)
            }
          }
        }
      \`
    `);
    expect(errors).toMatchSnapshot();
  });

  test('fragment: using argumentDefinitions', async () => {
    const errors = await validateSource(`
      graphql\`
        fragment Test on User @argumentDefinitions(
          showID: { type: "String" }
        ) {
          id @include(if: $showID)
        }
      \`
    `);

    expect(errors).toMatchSnapshot();
  });
});
