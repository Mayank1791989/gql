/* @flow */
import { type FileMatchConfig, type Globs } from './types';

export default function parseFileMatchConfig(
  match: FileMatchConfig,
): { glob: Globs, ignored: ?Globs } {
  // GlobPattern | Array<GlobPattern>
  if (typeof match === 'string' || Array.isArray(match)) {
    return { glob: match, ignored: [] };
  }

  return {
    glob: match.include,
    ignored: match.ignore || [],
  };
}
