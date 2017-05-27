/* @flow */
import { type GQLErrorLocation } from 'gql-shared/GQLError';
import { getLocation } from 'graphql';
import { type ASTNode } from '../language/ast';

type Nodes = $ReadOnlyArray<ASTNode>;

export default class GQLResolverError {
  message: string;
  nodes: Nodes;
  locations: $ReadOnlyArray<GQLErrorLocation>;

  constructor(message: string, nodes: Nodes) {
    this.nodes = nodes;
    this.message = message;
    this.locations = getLocations(nodes);
  }
}

function getLocations(nodes: Nodes) {
  return nodes
    .map(node => {
      const { loc } = node;
      if (!loc) {
        return null;
      }
      const { line, column } = getLocation(loc.source, loc.start);

      return {
        line,
        column,
        path: loc.source.name,
      };
    })
    .filter(Boolean);
}
