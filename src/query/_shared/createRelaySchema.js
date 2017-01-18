/* @flow */
import { GQLSchema, GQLDirective } from '../../shared/GQLTypes';
import GraphQLRelayDirective from 'babel-relay-plugin/lib/GraphQLRelayDirective';

const relayDirective = new GQLDirective(null, GraphQLRelayDirective);

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

