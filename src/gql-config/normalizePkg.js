/* @flow */
import path from 'path';
import { type PkgConfig } from './types';
import normalizePath from 'normalize-path';

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
  const normalizedPkg = normalizePath(pkg);

  if (path.isAbsolute(pkg) || isRelative(pkg)) {
    return normalizedPkg;
  }

  const parsed = parsePkg(normalizedPkg);

  if (parsed.name.startsWith(prefix)) {
    return normalizedPkg;
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
  return p.startsWith('./') || p.startsWith('../') || p.startsWith('~/');
}
