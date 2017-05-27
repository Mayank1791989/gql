/* @flow */
import minimatch from 'minimatch';
import { type FileMatchConfig, type Globs } from './types';

export default function matcher(
  filePath: string,
  match: FileMatchConfig,
): boolean {
  if (typeof match === 'string' || Array.isArray(match)) {
    return matchGlob(filePath, match);
  }

  const _match = matchGlob(filePath, match.include);
  if (!_match) {
    return false;
  }

  const _matchesIgnore = match.ignore
    ? matchGlob(filePath, match.ignore)
    : false;

  return _match && !_matchesIgnore;
}

function matchGlob(filePath, globs: Globs): boolean {
  // console.log(filePath, globs);
  if (typeof globs === 'string') {
    return minimatch(filePath, globs);
  }

  // matches any
  return Boolean(globs.find(glob => minimatch(filePath, glob)));
}
