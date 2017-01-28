/* @flow */
import { GQLSchema, GQLDirective } from '../../shared/GQLTypes';

import {
  GraphQLBoolean,
  GraphQLString,
  GraphQLList,
  DirectiveLocation,
} from 'graphql/type';

const relayDirective = new GQLDirective(null, {
  name: 'relay',
  description: 'The @relay directive.',
  args: {
    isConnectionWithoutNodeID: {
      description: 'Marks a connection field as containing nodes without `id` fields. This is used to silence the warning when diffing connections.',
      type: GraphQLBoolean,
    },
    isStaticFragment: {
      description: 'Marks a fragment as static. A static fragment will share the same identity regardless of how many times the expression is evaluated.',
      type: GraphQLBoolean,
    },
    pattern: {
      description: 'Marks a fragment as intended for pattern matching (as opposed to fetching).',
      type: GraphQLBoolean,
    },
    plural: {
      description: 'Marks a fragment as being backed by a GraphQLList',
      type: GraphQLBoolean,
    },
    variables: {
      description: 'Selectively pass variables down into a fragment.',
      type: new GraphQLList(GraphQLString),
    },
  },
  locations: [
    DirectiveLocation.FIELD,
    DirectiveLocation.FRAGMENT_DEFINITION,
  ],
});

// patch graphql schema to add relay support
export default function createRelaySchema(schema: GQLSchema): GQLSchema {
  return new Proxy(schema, {
    get(target, key) {
      if (key === '_directives') {
        return [
          // $FlowDisableNextLine
          ...target[key],
          relayDirective,
        ];
      }
      // $FlowDisableNextLine
      return target[key];
    },
  });
}

