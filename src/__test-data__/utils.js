/* @flow */
import path from 'path';
import { dedent } from 'dentist';
import splitLines from '../shared/splitLines';

export function getSchema() {
  jest.mock('../shared/watch');
  const watch = require('../shared/watch').default;
  const { GQLService } = require('../');
  const gql = new GQLService({ cwd: path.resolve('src/__test-data__/') });
  // $FlowDisableNextLine
  watch.__triggerChange();
  return gql._schemaBuilder.getSchema();
}

export function getDefLocations() {
  return {
    Player: {
      start: { line: 12, column: 1 },
      end: { line: 16, column: 2 },
      path: path.resolve('src/__test-data__/schema/query.gql'),
    },
    Player_id: { // eslint-disable-line camelcase
      start: { line: 13, column: 3 },
      end: { line: 13, column: 10 },
      path: path.resolve('src/__test-data__/schema/query.gql'),
    },
    Player_image_arg_size: { // eslint-disable-line camelcase
      start: { line: 15, column: 9 },
      end: { line: 15, column: 19 },
      path: path.resolve('src/__test-data__/schema/query.gql'),
    },

    Team: {
      start: { line: 17, column: 1 },
      end: { line: 20, column: 2 },
      path: path.resolve('src/__test-data__/schema/query.gql'),
    },
    Node: {
      start: { line: 8, column: 1 },
      end: { line: 10, column: 2 },
      path: path.resolve('src/__test-data__/schema/query.gql'),
    },
    Edge: {
      start: { line: 27, column: 1 },
      end: { line: 30, column: 2 },
      path: path.resolve('src/__test-data__/schema/query.gql'),
    },

    Mutation: {
      start: { line: 2, column: 1 },
      end: { line: 5, column: 2 },
      path: path.resolve('src/__test-data__/schema/mutation.gql'),
    },
    Mutation_PlayerCreate: { // eslint-disable-line camelcase
      start: { line: 4, column: 3 },
      end: { line: 4, column: 63 },
      path: path.resolve('src/__test-data__/schema/mutation.gql'),
    },
    Mutation_PlayerCreateInput: { // eslint-disable-line camelcase
      start: { line: 6, column: 1 },
      end: { line: 9, column: 2 },
      path: path.resolve('src/__test-data__/schema/mutation.gql'),
    },
    Mutation_PlayerCreateInput_id: { // eslint-disable-line camelcase
      start: { line: 8, column: 3 },
      end: { line: 8, column: 10 },
      path: path.resolve('src/__test-data__/schema/mutation.gql'),
    },

    Subscription: {
      start: { line: 1, column: 1 },
      end: { line: 4, column: 2 },
      path: path.resolve('src/__test-data__/schema/subscription.gql'),
    },
    Subscription_LikeStory: { // eslint-disable-line camelcase
      start: { line: 3, column: 3 },
      end: { line: 3, column: 77 },
      path: path.resolve('src/__test-data__/schema/subscription.gql'),
    },
    Subscription_LikeStorySubscriptionInput: { // eslint-disable-line camelcase
      start: { line: 6, column: 1 },
      end: { line: 9, column: 2 },
      path: path.resolve('src/__test-data__/schema/subscription.gql'),
    },
    Subscription_LikeStorySubscriptionInput_id: { // eslint-disable-line camelcase
      start: { line: 8, column: 3 },
      end: { line: 8, column: 10 },
      path: path.resolve('src/__test-data__/schema/subscription.gql'),
    },

    Query: {
      start: { line: 2, column: 1 },
      end: { line: 6, column: 2 },
      path: path.resolve('src/__test-data__/schema/query.gql'),
    },
    Query_viewer: { // eslint-disable-line camelcase
      start: { line: 5, column: 3 },
      end: { line: 5, column: 18 },
      path: path.resolve('src/__test-data__/schema/query.gql'),
    },

    Role: {
      start: { line: 1, column: 1 },
      end: { line: 5, column: 2 },
      path: path.resolve('src/__test-data__/schema/enums.gql'),
    },

    CustomScalar: {
      start: { line: 1, column: 1 },
      end: { line: 1, column: 20 },
      path: path.resolve('src/__test-data__/schema/scalars.gql'),
    },

    customDirective: {
      start: { line: 2, column: 1 },
      end: { line: 7, column: 25 },
      path: path.resolve('src/__test-data__/schema/directives.gql'),
    },
    customDirective_argIf: { // eslint-disable-line camelcase
      start: { line: 4, column: 3 },
      end: { line: 4, column: 15 },
      path: path.resolve('src/__test-data__/schema/directives.gql'),
    },
  };
}

export function getRefLocations() {
  return {
    Player: [
      {
        start: { line: 40, column: 23 },
        end: { line: 40, column: 29 },
        path: path.resolve('src/__test-data__/schema/query.gql'),
      },
      {
        start: { line: 14, column: 11 },
        end: { line: 14, column: 17 },
        path: path.resolve('src/__test-data__/schema/mutation.gql'),
      },
      {
        start: { line: 24, column: 7 },
        end: { line: 24, column: 13 },
        path: path.resolve('src/__test-data__/schema/query.gql'),
      },
      {
        start: { line: 12, column: 6 },
        end: { line: 12, column: 12 },
        path: path.resolve('src/__test-data__/schema/query.gql'),
      },
    ],

    Edge: [
      {
        start: { line: 28, column: 11 },
        end: { line: 28, column: 15 },
        path: path.resolve('src/__test-data__/schema/query.gql'),
      },
    ],

    Role: [
      {
        start: { line: 10, column: 9 },
        end: { line: 10, column: 13 },
        path: path.resolve('src/__test-data__/schema/mutation.gql'),
      },
      {
        start: { line: 34, column: 9 },
        end: { line: 34, column: 13 },
        path: path.resolve('src/__test-data__/schema/query.gql'),
      },
      {
        start: { line: 36, column: 15 },
        end: { line: 36, column: 19 },
        path: path.resolve('src/__test-data__/schema/query.gql'),
      },
      {
        start: { line: 1, column: 6 },
        end: { line: 1, column: 10 },
        path: path.resolve('src/__test-data__/schema/enums.gql'),
      },
    ],

    CustomScalar: [
      {
        start: { line: 35, column: 10 },
        end: { line: 35, column: 22 },
        path: path.resolve('src/__test-data__/schema/query.gql'),
      },
      {
        start: { line: 1, column: 8 },
        end: { line: 1, column: 20 },
        path: path.resolve('src/__test-data__/schema/scalars.gql'),
      },
    ],
  };
}

export function getHints() {
  return {
    ObjectTypes: [
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
    ],

    OutputTypes: [
      {
        description: '',
        text: 'Role',
        type: 'Enum',
      },
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
        text: 'Node',
        type: 'Interface',
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
        text: 'Edge',
        type: 'Interface',
      },
      {
        description: '',
        text: 'NewPlayer',
        type: 'Object',
      },
      {
        description: '',
        text: 'Entity',
        type: 'Union',
      },
      {
        description: '',
        text: 'CustomScalar',
        type: 'Scalar',
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
      {
        description: 'The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.',
        text: 'String',
        type: 'Scalar',
      },
      {
        description: 'The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. ',
        text: 'Int',
        type: 'Scalar',
      },
      {
        description: 'The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](http://en.wikipedia.org/wiki/IEEE_floating_point). ',
        text: 'Float',
        type: 'Scalar',
      },
      {
        description: 'The `Boolean` scalar type represents `true` or `false`.',
        text: 'Boolean',
        type: 'Scalar',
      },
      {
        description: 'The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.',
        text: 'ID',
        type: 'Scalar',
      },
    ],

    CompositeTypes: [
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
        text: 'Node',
        type: 'Interface',
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
        text: 'Edge',
        type: 'Interface',
      },
      {
        description: '',
        text: 'NewPlayer',
        type: 'Object',
      },
      {
        description: '',
        text: 'Entity',
        type: 'Union',
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
    ],

    InputTypes: [
      {
        description: '',
        text: 'Role',
        type: 'Enum',
      },
      {
        description: '',
        text: 'PlayerCreateInput',
        type: 'Input',
      },
      {
        description: '',
        text: 'CustomScalar',
        type: 'Scalar',
      },
      {
        description: '',
        text: 'LikeStorySubscriptionInput',
        type: 'Input',
      },
      {
        description: 'The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.',
        text: 'String',
        type: 'Scalar',
      },
      {
        description: 'The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. ',
        text: 'Int',
        type: 'Scalar',
      },
      {
        description: 'The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](http://en.wikipedia.org/wiki/IEEE_floating_point). ',
        text: 'Float',
        type: 'Scalar',
      },
      {
        description: 'The `Boolean` scalar type represents `true` or `false`.',
        text: 'Boolean',
        type: 'Scalar',
      },
      {
        description: 'The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.',
        text: 'ID',
        type: 'Scalar',
      },
    ],

    InterfaceTypes: [
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
    ],

    PlayerTypeFields: [
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
    ],

    PlayerTypeImageFieldArgs: [
      {
        description: '',
        text: 'size',
        type: 'Int!',
      },
    ],

    TypesImplementsNode: [
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
    ],

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

    QueryFields: [
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
    ],

    EnumRoleValues: [
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
    ],

    DocumentLevel: [
      { text: 'query' },
      { text: 'mutation' },
      { text: 'subscription' },
      { text: 'fragment' },
      { text: '{' },
    ],
  };
}

export function code(text: string) {
  const sourceText = dedent(text);
  const lines = splitLines(sourceText);
  let position = null;
  lines.forEach((line, index) => {
    const match = line.match(/--\^/);
    if (match) {
      position = {
        // $FlowDisableNextLine
        column: match.index + 3,
        line: index,
      };
    }
  });

  if (!position) {
    throw new Error('Missing --^ in source');
  }

  return {
    sourceText,
    position,
  };
}
