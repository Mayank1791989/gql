/* @flow */
import { type DefLocation } from './types';
import { type ASTNode } from 'graphql/language/ast';

function getDefLocationForNode(node?: ?ASTNode): ?DefLocation {
  if (node && node.loc) {
    // NOTE: type.node is undefined for graphql core types (String|Boolean ...)
    const { loc } = node;
    const defLocation = {
      start: {
        line: loc.startToken.line,
        column: loc.startToken.column,
      },
      end: {
        line: loc.endToken.line,
        column: loc.endToken.column + (loc.endToken.end - loc.endToken.start),
      },
      path: loc.source.name,
    };
    // console.timeEnd('getDef');
    return defLocation;
  }
  return null;
}

export default getDefLocationForNode;
