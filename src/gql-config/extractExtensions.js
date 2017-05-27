/* @flow */
import { type FileMatchConfig, type GQLConfigFileResolved } from './types';

import _uniq from 'lodash/uniq';
import parseGlob from 'parse-glob';

function getExtFromGlob(glob: string): string {
  return parseGlob(glob).path.ext; // without dot
}

function _extractExtensionsFromGlobs(match: FileMatchConfig): Array<string> {
  if (typeof match === 'string') {
    return [getExtFromGlob(match)];
  }

  if (Array.isArray(match)) {
    return match.map(getExtFromGlob);
  }

  // object { match, exclude }
  return _extractExtensionsFromGlobs(match.include);
}

export default function extractExtensions(
  config: GQLConfigFileResolved,
): Array<string> {
  const { schema, query } = config;
  const extensions = [];

  // schema
  extensions.push(..._extractExtensionsFromGlobs(schema.files));

  // query
  if (query) {
    query.files.forEach(({ match }) => {
      extensions.push(..._extractExtensionsFromGlobs(match));
    });
  }

  return _uniq(extensions);
}
