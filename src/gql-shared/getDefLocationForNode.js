/* @flow */
import { type GQLLocation } from './types';
import { getLocation, type ASTNode } from 'graphql';

function getDefLocationForNode(node?: ?ASTNode): ?GQLLocation {
  if (node && node.loc) {
    // NOTE: type.node is undefined for graphql core types (String|Boolean ...)
    const { loc } = node;
    const defLocation = {
      start: getLocation(loc.source, loc.start),
      end: getLocation(loc.source, loc.end),
      path: loc.source.name,
    };
    return defLocation;
  }
  return null;
}

export default getDefLocationForNode;
