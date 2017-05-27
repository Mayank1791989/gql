/* @flow */
import path from 'path';
import { GQLSchema } from 'gql-shared/GQLSchema';
import GQLService from 'gql-service';
import { type GQLHint, type GQLLocation } from 'gql-shared/types';
import { dedent } from 'dentist';
import fs from 'fs-extra';
import _memoize from 'lodash/memoize';
import _orderBy from 'lodash/orderBy';
import normalizePath from 'normalize-path';

export async function getSchema(): Promise<GQLSchema> {
  const gqlService = new GQLService({
    configDir: __dirname,
    watch: false,
  });
  gqlService.onError(err => {
    throw err;
  });
  await gqlService.start();
  return gqlService.getSchema();
}

export const getSchemaFiles = _memoize(() => {
  const schemaDir = path.join(__dirname, 'schema');
  const filePaths = fs.readdirSync(schemaDir);
  return filePaths.reduce((acc, filePath) => {
    acc[normalizePath(path.join('schema', filePath))] = fs.readFileSync(
      path.join(schemaDir, filePath),
      {
        encoding: 'utf8',
      },
    );
    return acc;
  }, {});
});

export function getDefLocations(dir: string = __dirname) {
  /* eslint-disable camelcase */
  return {
    Player: {
      start: { line: 12, column: 1 },
      end: { line: 16, column: 2 },
      path: path.resolve(dir, 'schema/query.gql'),
    },
    Player_id: {
      start: { line: 13, column: 3 },
      end: { line: 13, column: 10 },
      path: path.resolve(dir, 'schema/query.gql'),
    },
    Player_image_arg_size: {
      start: { line: 15, column: 9 },
      end: { line: 15, column: 19 },
      path: path.resolve(dir, 'schema/query.gql'),
    },

    Team: {
      start: { line: 17, column: 1 },
      end: { line: 20, column: 2 },
      path: path.resolve(dir, 'schema/query.gql'),
    },
    Node: {
      start: { line: 8, column: 1 },
      end: { line: 10, column: 2 },
      path: path.resolve(dir, 'schema/query.gql'),
    },
    Node_id: {
      start: { line: 9, column: 3 },
      end: { line: 9, column: 10 },
      path: path.resolve(dir, 'schema/query.gql'),
    },
    Edge: {
      start: { line: 27, column: 1 },
      end: { line: 30, column: 2 },
      path: path.resolve(dir, 'schema/query.gql'),
    },

    Mutation: {
      start: { line: 2, column: 1 },
      end: { line: 5, column: 2 },
      path: path.resolve(dir, 'schema/mutation.gql'),
    },
    Mutation_PlayerCreate: {
      start: { line: 4, column: 3 },
      end: { line: 4, column: 63 },
      path: path.resolve(dir, 'schema/mutation.gql'),
    },
    Mutation_PlayerCreateInput: {
      start: { line: 7, column: 1 },
      end: { line: 11, column: 2 },
      path: path.resolve(dir, 'schema/mutation.gql'),
    },
    Mutation_PlayerCreateInput_id: {
      start: { line: 8, column: 3 },
      end: { line: 8, column: 10 },
      path: path.resolve(dir, 'schema/mutation.gql'),
    },

    Subscription: {
      start: { line: 1, column: 1 },
      end: { line: 4, column: 2 },
      path: path.resolve(dir, 'schema/subscription.gql'),
    },
    Subscription_LikeStory: {
      start: { line: 3, column: 3 },
      end: { line: 3, column: 77 },
      path: path.resolve(dir, 'schema/subscription.gql'),
    },
    Subscription_LikeStorySubscriptionInput: {
      start: { line: 6, column: 1 },
      end: { line: 9, column: 2 },
      path: path.resolve(dir, 'schema/subscription.gql'),
    },
    Subscription_LikeStorySubscriptionInput_id: {
      start: { line: 8, column: 3 },
      end: { line: 8, column: 10 },
      path: path.resolve(dir, 'schema/subscription.gql'),
    },

    Query: {
      start: { line: 2, column: 1 },
      end: { line: 6, column: 2 },
      path: path.resolve(dir, 'schema/query.gql'),
    },
    Query_viewer: {
      start: { line: 5, column: 3 },
      end: { line: 5, column: 18 },
      path: path.resolve(dir, 'schema/query.gql'),
    },

    Role: {
      start: { line: 1, column: 1 },
      end: { line: 5, column: 2 },
      path: path.resolve(dir, 'schema/enums.gql'),
    },

    Role_roleA: {
      start: { line: 2, column: 3 },
      end: { line: 2, column: 8 },
      path: path.resolve(dir, 'schema/enums.gql'),
    },

    CustomScalar: {
      start: { line: 1, column: 1 },
      end: { line: 1, column: 20 },
      path: path.resolve(dir, 'schema/scalars.gql'),
    },

    customDirective: {
      start: { line: 2, column: 1 },
      end: { line: 7, column: 25 },
      path: path.resolve(dir, 'schema/directives.gql'),
    },
    customDirective_argIf: {
      start: { line: 4, column: 3 },
      end: { line: 4, column: 15 },
      path: path.resolve(dir, 'schema/directives.gql'),
    },

    Entity: {
      start: { line: 41, column: 1 },
      end: { line: 41, column: 29 },
      path: path.resolve(dir, 'schema/query.gql'),
    },
  };
  /* eslint-enable */
}

export function sortRefs(
  refs: $ReadOnlyArray<GQLLocation>,
): $ReadOnlyArray<GQLLocation> {
  return [...refs].sort((locA: GQLLocation, locB: GQLLocation) => {
    if (locA.path < locB.path) {
      return -1;
    }
    if (locA.path > locB.path) {
      return 1;
    }

    if (locA.start.line < locB.start.line) {
      return -1;
    }

    if (locA.start.line > locB.start.line) {
      return 1;
    }

    return 0;
  });
}

export function getAllRefs(dir: string = __dirname) {
  return {
    Player: sortRefs([
      {
        start: { line: 41, column: 23 },
        end: { line: 41, column: 29 },
        path: path.resolve(dir, 'schema/query.gql'),
      },
      {
        start: { line: 14, column: 11 },
        end: { line: 14, column: 17 },
        path: path.resolve(dir, 'schema/mutation.gql'),
      },
      {
        start: { line: 24, column: 7 },
        end: { line: 24, column: 13 },
        path: path.resolve(dir, 'schema/query.gql'),
      },
      {
        start: { line: 12, column: 1 },
        end: { line: 16, column: 2 },
        path: path.resolve(dir, 'schema/query.gql'),
      },
    ]),

    XPlayer: sortRefs([
      {
        start: { line: 25, column: 8 },
        end: { line: 25, column: 15 },
        path: path.resolve(dir, 'schema/query.gql'),
      },
    ]),

    Edge: sortRefs([
      {
        start: { line: 28, column: 1 },
        end: { line: 31, column: 2 },
        path: path.resolve(dir, 'schema/query.gql'),
      },
    ]),

    Role: sortRefs([
      {
        start: { line: 10, column: 9 },
        end: { line: 10, column: 13 },
        path: path.resolve(dir, 'schema/mutation.gql'),
      },
      {
        start: { line: 34, column: 9 },
        end: { line: 34, column: 13 },
        path: path.resolve(dir, 'schema/query.gql'),
      },
      {
        start: { line: 36, column: 15 },
        end: { line: 36, column: 19 },
        path: path.resolve(dir, 'schema/query.gql'),
      },
      {
        start: { line: 1, column: 1 },
        end: { line: 5, column: 2 },
        path: path.resolve(dir, 'schema/enums.gql'),
      },
    ]),

    CustomScalar: sortRefs([
      {
        start: { line: 35, column: 10 },
        end: { line: 35, column: 22 },
        path: path.resolve(dir, 'schema/query.gql'),
      },
      {
        start: { line: 1, column: 1 },
        end: { line: 1, column: 20 },
        path: path.resolve(dir, 'schema/scalars.gql'),
      },
    ]),

    Int: [
      {
        start: { line: 15, column: 15 },
        end: { line: 15, column: 18 },
        path: path.resolve(dir, 'schema/query.gql'),
      },
    ],
  };
}

export function sortHints(
  hints: $ReadOnlyArray<GQLHint>,
): $ReadOnlyArray<GQLHint> {
  const keys: Array<$Keys<GQLHint>> = ['text', 'type'];
  return _orderBy(hints, keys, ['asc', 'desc']);
}

export function getHints() {
  const introspectionHints = [
    {
      text: '__Directive',
      type: 'Object',
      description:
        "A Directive provides a way to describe alternate runtime execution and type validation behavior in a GraphQL document.\n\nIn some cases, you need to provide options to alter GraphQL's execution behavior in ways field arguments will not suffice, such as conditionally including or skipping a field. Directives provide this by describing additional information to the executor.",
    },
    {
      text: '__EnumValue',
      type: 'Object',
      description:
        'One possible value for a given Enum. Enum values are unique values, not a placeholder for a string or numeric value. However an Enum value is returned in a JSON response as a string.',
    },
    {
      text: '__Field',
      type: 'Object',
      description:
        'Object and Interface types are described by a list of Fields, each of which has a name, potentially a list of arguments, and a return type.',
    },
    {
      text: '__InputValue',
      type: 'Object',
      description:
        'Arguments provided to Fields or Directives and the input fields of an InputObject are represented as Input Values which describe their type and optionally a default value.',
    },
    {
      text: '__Schema',
      type: 'Object',
      description:
        'A GraphQL Schema defines the capabilities of a GraphQL server. It exposes all available types and directives on the server, as well as the entry points for query, mutation, and subscription operations.',
    },
    {
      text: '__Type',
      type: 'Object',
      description:
        'The fundamental unit of any GraphQL Schema is the type. There are many kinds of types in GraphQL as represented by the `__TypeKind` enum.\n\nDepending on the kind of a type, certain fields describe information about that type. Scalar types provide no information beyond a name and description, while Enum types provide their values. Object and Interface types provide the fields they describe. Abstract types, Union and Interface, provide the Object types possible at runtime. List and NonNull types compose other types.',
    },
    {
      text: '__DirectiveLocation',
      type: 'Enum',
      description:
        'A Directive can be adjacent to many parts of the GraphQL language, a __DirectiveLocation describes one such possible adjacencies.',
    },
    {
      text: '__TypeKind',
      type: 'Enum',
      description: 'An enum describing what kind of type a given `__Type` is.',
    },
  ];

  const missingTypeDeclarationHints = [
    {
      text: 'XPlayer',
      type: 'Scalar',
      description: 'Type declaration missing.',
    },
    {
      text: 'string',
      type: 'Scalar',
      description: 'Type declaration missing.',
    },
  ];

  const scalarTypes = [
    {
      description: '',
      text: 'CustomScalar',
      type: 'Scalar',
    },
    {
      description:
        'The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.',
      text: 'String',
      type: 'Scalar',
    },
    {
      description:
        'The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. ',
      text: 'Int',
      type: 'Scalar',
    },
    {
      description:
        'The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](http://en.wikipedia.org/wiki/IEEE_floating_point). ',
      text: 'Float',
      type: 'Scalar',
    },
    {
      description: 'The `Boolean` scalar type represents `true` or `false`.',
      text: 'Boolean',
      type: 'Scalar',
    },
    {
      description:
        'The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.',
      text: 'ID',
      type: 'Scalar',
    },
  ];

  const objectTypes = [
    {
      description: 'Mutation contains all allowed mutations',
      text: 'Mutation',
      type: 'Object',
    },
    {
      description: '',
      text: 'PlayerCreatePayload',
      type: 'Object',
    },
    {
      description: 'Query is the root query object',
      text: 'Query',
      type: 'Object',
    },
    {
      description: '',
      text: 'Player',
      type: 'Object',
    },
    {
      description: '',
      text: 'Team',
      type: 'Object',
    },
    {
      description: '',
      text: 'Viewer',
      type: 'Object',
    },
    {
      description: '',
      text: 'NewPlayer',
      type: 'Object',
    },
    {
      description: '',
      text: 'Subscription',
      type: 'Object',
    },
    {
      description: '',
      text: 'LikeStorySubscriptionPayload',
      type: 'Object',
    },
  ];

  const interfaceTypes = [
    {
      description: '',
      text: 'Node',
      type: 'Interface',
    },
    {
      description: '',
      text: 'Edge',
      type: 'Interface',
    },
  ];

  const unionTypes = [
    {
      description: '',
      text: 'Entity',
      type: 'Union',
    },
  ];

  const enumTypes = [
    {
      description: '',
      text: 'Role',
      type: 'Enum',
    },
  ];

  const directives = {
    custom: {
      text: 'customDirective',
      type: 'Directive',
      description: 'some custom directive',
    },
    deprecated: {
      text: 'deprecated',
      type: 'Directive',
      description:
        'Marks an element of a GraphQL schema as no longer supported.',
    },
    include: {
      text: 'include',
      type: 'Directive',
      description:
        'Directs the executor to include this field or fragment only when the `if` argument is true.',
    },
    skip: {
      text: 'skip',
      type: 'Directive',
      description:
        'Directs the executor to skip this field or fragment when the `if` argument is true.',
    },
  };

  const MutationPlayerCreateInput = {
    description: '',
    text: 'PlayerCreateInput',
    type: 'Input',
  };

  const SubscriptionLikStoryInput = {
    description: '',
    text: 'LikeStorySubscriptionInput',
    type: 'Input',
  };

  return {
    ScalarTypes: sortHints([...scalarTypes]),

    ObjectTypes: sortHints([
      ...objectTypes,
      ...introspectionHints.filter(({ type }) => type === 'Object'),
    ]),

    InterfaceTypes: sortHints(interfaceTypes),

    OutputTypes: sortHints([
      ...objectTypes,
      ...interfaceTypes,
      ...enumTypes,
      ...scalarTypes,
      ...unionTypes,
      ...introspectionHints,
      ...missingTypeDeclarationHints,
    ]),

    CompositeTypes: sortHints([
      ...objectTypes,
      ...interfaceTypes,
      ...unionTypes,
      ...introspectionHints.filter(({ type }) => type === 'Object'),
    ]),

    InputTypes: sortHints([
      MutationPlayerCreateInput,
      SubscriptionLikStoryInput,
      ...scalarTypes,
      ...enumTypes,
      ...introspectionHints.filter(({ type }) => type === 'Enum'),
      ...missingTypeDeclarationHints,
    ]),

    EnumTypes: sortHints([
      ...enumTypes,
      ...introspectionHints.filter(({ type }) => type === 'Enum'),
    ]),

    Directives: sortHints([
      directives.custom,
      directives.deprecated,
      directives.include,
      directives.skip,
    ]),

    FieldDirectives: sortHints([
      directives.custom,
      directives.include,
      directives.skip,
    ]),

    PlayerTypeFields: sortHints([
      {
        description: '',
        text: 'id',
        type: 'ID!',
      },
      {
        description: '',
        text: 'name',
        type: 'String!',
      },
      {
        description: '',
        text: 'image',
        type: 'String!',
      },
    ]),

    PlayerTypeImageFieldArgs: sortHints([
      {
        description: '',
        text: 'size',
        type: 'Int!',
      },
    ]),

    PlayerCreateInputFields: sortHints([
      {
        description: '',
        text: 'id',
        type: 'ID!',
      },
      {
        description: '',
        text: 'role',
        type: 'Role!',
      },
      {
        description: '',
        text: 'name',
        type: 'String!',
      },
    ]),

    PlayerCreateArgs: sortHints([
      {
        type: 'PlayerCreateInput!',
        text: 'input',
        description: '',
      },
    ]),

    LikeStorySubscriptionArgs: [
      {
        type: 'LikeStorySubscriptionInput',
        text: 'input',
        description: '',
      },
    ],

    TypesImplementsNode: sortHints([
      {
        description: '',
        text: 'Player',
        type: 'Object',
      },
      {
        description: '',
        text: 'Team',
        type: 'Object',
      },
      {
        description: '',
        text: 'Node',
        type: 'Interface',
      },
    ]),

    PossibleMutations: [
      {
        description: 'Player Create contains all allowed mutations',
        text: 'PlayerCreate',
        type: 'PlayerCreatePayload',
      },
    ],

    PossibleSubscriptions: [
      {
        description: 'Like story subscription',
        text: 'LikeStory',
        type: 'LikeStorySubscriptionPayload',
      },
    ],

    QueryFields: sortHints([
      {
        description: '',
        text: 'node',
        type: 'Node',
      },
      {
        description: '',
        text: 'nodes',
        type: '[Node]',
      },
      {
        description: '',
        text: 'viewer',
        type: 'Viewer!',
      },
      {
        description: 'Access the current type schema of this server.',
        text: '__schema',
        type: '__Schema!',
      },
      {
        description: 'Request the type information of a single type.',
        text: '__type',
        type: '__Type',
      },
    ]),

    EnumRoleValues: sortHints([
      {
        description: '',
        text: 'roleA',
        type: 'Role',
      },
      {
        description: '',
        text: 'roleB',
        type: 'Role',
      },
      {
        description: '',
        text: 'roleC',
        type: 'Role',
      },
    ]),

    DocumentLevel: sortHints([
      { text: 'query' },
      { text: 'mutation' },
      { text: 'subscription' },
      { text: 'fragment' },
      { text: '{' },
    ]),

    TypeNameMetaField: [
      {
        description: 'The name of the current Object type at runtime.',
        text: '__typename',
        type: 'String!',
      },
    ],
    SchemaMetaField: [
      {
        description: 'Access the current type schema of this server.',
        text: '__schema',
        type: '__Schema!',
      },
    ],
    TypeMetaField: [
      {
        description: 'Request the type information of a single type.',
        text: '__type',
        type: '__Type',
      },
    ],

    RelayDirectiveArgs: sortHints([
      {
        description:
          'Marks this fragment spread as being deferrable such that it loads after other portions of the view.',
        text: 'deferrable',
        type: 'Boolean',
      },
      {
        description:
          "Marks a connection field as containing nodes without 'id' fields. This is used to silence the warning when diffing connections.",
        text: 'isConnectionWithoutNodeID',
        type: 'Boolean',
      },
      {
        description:
          'Marks a fragment spread which should be unmasked if provided false',
        text: 'mask',
        type: 'Boolean',
      },
      {
        description:
          'Marks a fragment as intended for pattern matching (as opposed to fetching). Used in Classic only.',
        text: 'pattern',
        type: 'Boolean',
      },
      {
        description: 'Marks a fragment as being backed by a GraphQLList.',
        text: 'plural',
        type: 'Boolean',
      },
      {
        description:
          'Selectively pass variables down into a fragment. Only used in Classic.',
        text: 'variables',
        type: '[String!]',
      },
    ]),

    ResolverTypes: sortHints([
      ...scalarTypes,
      ...enumTypes,
      ...objectTypes,
      ...interfaceTypes,
      ...unionTypes,
    ]),
  };
}

export function getAllInfo() {
  return {
    PlayerType: {
      contents: [
        dedent(`
          type Player implements Node {
            id: ID!
            name: String!
            image(size: Int!): String!
          }
        `),
      ],
    },

    RoleEnum: {
      contents: [
        dedent(`
          enum Role {
            roleA
            roleB
            roleC
          }
        `),
      ],
    },

    // eslint-disable-next-line camelcase
    RoleEnum_roleA: {
      contents: [
        'roleA',
        dedent(`
          enum Role {
            roleA
            roleB
            roleC
          }
        `),
      ],
    },

    CustomScalar: {
      contents: [
        dedent(`
          scalar CustomScalar
        `),
      ],
    },

    NodeInterface: {
      contents: [
        dedent(`
          interface Node {
            id: ID!
          }
        `),
      ],
    },

    String: {
      contents: [
        dedent(`
          # The \`String\` scalar type represents textual data, represented as UTF-8 character
          # sequences. The String type is most often used by GraphQL to represent free-form
          # human-readable text.
          scalar String
        `),
      ],
    },

    NewPlayerFriendField: {
      contents: [
        `
          # description for friend field
          friend: Node!
        `,
        `
          interface Node {
            id: ID!
          }
        `,
      ].map(dedent),
    },

    PlayerImageSizeArg: {
      contents: [
        'size: Int!',
        dedent(`
          # The \`Int\` scalar type represents non-fractional signed whole numeric values. Int
          # can represent values between -(2^31) and 2^31 - 1.
          scalar Int
        `),
      ],
    },

    Mutation: {
      contents: [
        dedent(`
          # Mutation contains all allowed mutations
          type Mutation {
            # Player Create contains all allowed mutations
            PlayerCreate(input: PlayerCreateInput!): PlayerCreatePayload
          }
        `),
      ],
    },

    MutationPlayerCreate: {
      contents: [
        `
          # Player Create contains all allowed mutations
          PlayerCreate(input: PlayerCreateInput!): PlayerCreatePayload
        `,
        `
          input PlayerCreateInput {
            id: ID!
            name: String!
            role: Role!
          }
        `,
        `
          type PlayerCreatePayload {
            player: Player!
          }
        `,
      ].map(dedent),
    },

    PlayerCreateInput: {
      contents: [
        `
          input PlayerCreateInput {
            id: ID!
            name: String!
            role: Role!
          }
        `,
      ].map(dedent),
    },

    PlayerCreateInputRoleField: {
      contents: [
        `
          role: Role!
        `,
        `
          enum Role {
            roleA
            roleB
            roleC
          }
        `,
      ].map(dedent),
    },

    Query: {
      contents: [
        `
          # Query is the root query object
          type Query {
            node(id: String!): Node
            nodes(ids: [String!]): [Node]
            viewer: Viewer!
          }
        `,
      ].map(dedent),
    },

    QueryViewerField: {
      contents: [
        `
          viewer: Viewer!
        `,
        `
          type Viewer {
            me: Player!
            xme: XPlayer! # validation error
          }
        `,
      ].map(dedent),
    },

    Subscription: {
      contents: [
        `
          type Subscription {
            # Like story subscription
            LikeStory(input: LikeStorySubscriptionInput): LikeStorySubscriptionPayload
          }
        `,
      ].map(dedent),
    },

    SubscriptionLikeStoryField: {
      contents: [
        `
          # Like story subscription
          LikeStory(input: LikeStorySubscriptionInput): LikeStorySubscriptionPayload
        `,
        `
          input LikeStorySubscriptionInput {
            clientSubscriptionId: String
            id: ID!
          }
        `,
        `
          type LikeStorySubscriptionPayload {
            clientSubscriptionId: String
            doesViewerLike: Boolean
          }
        `,
      ].map(dedent),
    },

    LikeStorySubscriptionInputIdField: {
      contents: [
        'id: ID!',
        `
          # The \`ID\` scalar type represents a unique identifier, often used to refetch an
          # object or as key for a cache. The ID type appears in a JSON response as a
          # String; however, it is not intended to be human-readable. When expected as an
          # input type, any string (such as \`"4"\`) or integer (such as \`4\`) input value will
          # be accepted as an ID.
          scalar ID
        `,
      ].map(dedent),
    },

    IncludeDirective: {
      contents: [
        `
          # Directs the executor to include this field or fragment only when the \`if\` argument is true.
          directive @include(
            # Included when true.
            if: Boolean!
          ) on FIELD | FRAGMENT_SPREAD | INLINE_FRAGMENT
        `,
      ].map(dedent),
    },

    IncludeDirectiveIfArg: {
      contents: [
        `
          # Included when true.
          if: Boolean!
        `,
        `
          # The \`Boolean\` scalar type represents \`true\` or \`false\`.
          scalar Boolean
        `,
      ].map(dedent),
    },

    CustomDirective: {
      contents: [
        `
          # some custom directive
          directive @customDirective(
            # description for arg
            if: Boolean!
          )
            on FIELD
             | FRAGMENT_DEFINITION
        `,
      ].map(dedent),
    },

    CustomDirectiveIfArg: {
      contents: [
        `
          # description for arg
          if: Boolean!
        `,
        `
          # The \`Boolean\` scalar type represents \`true\` or \`false\`.
          scalar Boolean
        `,
      ].map(dedent),
    },

    TypeNameMeta: {
      contents: [
        `
          # The name of the current Object type at runtime.
            __typename: String!
        `,
        `
          # The \`String\` scalar type represents textual data, represented as UTF-8 character
          # sequences. The String type is most often used by GraphQL to represent free-form
          # human-readable text.
          scalar String
        `,
      ].map(dedent),
    },

    SchemaMeta: {
      contents: [
        `
          # Access the current type schema of this server.
            __schema: __Schema!
        `,

        `
          # A GraphQL Schema defines the capabilities of a GraphQL server. It exposes all
          # available types and directives on the server, as well as the entry points for
          # query, mutation, and subscription operations.
          type __Schema {
            # A list of all types supported by this server.
            types: [__Type!]!

            # The type that query operations will be rooted at.
            queryType: __Type!

            # If this server supports mutation, the type that mutation operations will be rooted at.
            mutationType: __Type

            # If this server support subscription, the type that subscription operations will be rooted at.
            subscriptionType: __Type

            # A list of all directives supported by this server.
            directives: [__Directive!]!
          }
        `,
      ].map(dedent),
    },

    TypeMeta: {
      contents: [
        `
        # Request the type information of a single type.
          __type(name: String!): __Type
        `,

        `
        # The fundamental unit of any GraphQL Schema is the type. There are many kinds of
        # types in GraphQL as represented by the \`__TypeKind\` enum.
        #
        # Depending on the kind of a type, certain fields describe information about that
        # type. Scalar types provide no information beyond a name and description, while
        # Enum types provide their values. Object and Interface types provide the fields
        # they describe. Abstract types, Union and Interface, provide the Object types
        # possible at runtime. List and NonNull types compose other types.
        type __Type {
          kind: __TypeKind!
          name: String
          description: String
          fields(includeDeprecated: Boolean = false): [__Field!]
          interfaces: [__Type!]
          possibleTypes: [__Type!]
          enumValues(includeDeprecated: Boolean = false): [__EnumValue!]
          inputFields: [__InputValue!]
          ofType: __Type
        }
        `,
      ].map(dedent),
    },
  };
}
