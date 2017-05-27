/* @flow */
import path from 'path';
import { type PkgConfig } from './types';

export function normalizePkgConfig(prefix: string, pkgConfig: PkgConfig) {
  let pkgName = null;
  let pkgOptions = null;

  if (typeof pkgConfig === 'string') {
    pkgName = pkgConfig;
    pkgOptions = {};
  } else {
    /* eslint-disable prefer-destructuring */
    pkgName = pkgConfig[0];
    pkgOptions = pkgConfig[1];
    /* eslint-enable prefer-destructuring */
  }

  return [normalizePkgName(prefix, pkgName), pkgOptions];
}

export function normalizePkgName(prefix: string, pkg: string) {
  if (path.isAbsolute(pkg) || isRelative(pkg)) {
    return pkg;
  }

  const parsed = parsePkg(pkg);

  if (parsed.name.startsWith(prefix)) {
    return pkg;
  }

  // need to add prefix
  return parsed.scope
    ? `@${parsed.scope}/${prefix}-${parsed.name}`
    : `${prefix}-${parsed.name}`;
}

function parsePkg(pkg: string) {
  const scopePkgRegex = /@([a-z0-9][\w-.]+)\/([a-z0-9][\w-.]*)/;

  const match = pkg.match(scopePkgRegex);
  if (match) {
    return {
      scope: match[1],
      name: match[2],
    };
  }

  return {
    scope: null,
    name: pkg,
  };
}

function isRelative(p: string): boolean {
  // checking
  // 1) ./ or .\
  // 2) ../ or ..\
  // 3) ~/ (linux)
  return (
    p.startsWith(`.${path.sep}`) ||
    p.startsWith(`..${path.sep}`) ||
    p.startsWith('~/')
  );
}
