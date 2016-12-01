/* @flow */
import { GraphQLError } from 'graphql/error';
import type { Location, GQLError } from '../utils/types';
import { SEVERITY } from '../constants';

type Severity = $Keys<typeof SEVERITY>;

function patchLocation({ line, column }, source): Location {
  return {
    line,
    column,
    path: source.name,
  };
}

function cleanMessage(message) {
  const matches = /Syntax Error .+ \(\d+:\d+\) (.+)/.exec(message);
  if (matches) {
    return `Syntax Error: ${matches[1]}`;
  }
  return message;
}

// NOTE: patched error locations to add file path
function patchLocationsUsingNodes(locations, nodes): Array<Location> {
  const errorNodes = nodes.filter(node => node.loc);
  if (locations) {
    return locations.reduce((acc, location, index) => {
      const errorNode = errorNodes[index];
      if (errorNode.loc) {
        acc.push(patchLocation(location, errorNode.loc.source));
      }
      return acc;
    }, []);
  }
  return [];
}

function patchLocationsUsingSource(locations, source): Array<Location> {
  return locations.map(({ line, column }) => patchLocation({ line, column }, source));
}

function patchLocations(error: GraphQLError) {
  let locations;
  if (error.nodes && error.nodes.length > 0) {
    // NOTE: here nodes can be in differenct files
    locations = patchLocationsUsingNodes(error.locations, error.nodes);
  } else if (error.source && error.locations) {
    // lexer errors doesnt contains node
    locations = patchLocationsUsingSource(error.locations, error.source);
  }
  return locations;
}

export function toGQLError(error: GraphQLError, severity: Severity): GQLError {
  return {
    message: cleanMessage(error.message),
    locations: patchLocations(error),
    severity,
  };
}

export function newGQLError(message: string, nodes: ?Array<*>, severity: Severity) {
  const error = new GraphQLError(message, nodes);
  return toGQLError(error, severity);
}
