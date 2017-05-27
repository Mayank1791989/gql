/* @flow */
/* @babel-flow-runtime-enable */
import path from 'path';
import { type PkgConfig } from './types';
import normalizePath from 'normalize-path';
import importModule from 'gql-shared/importModule';

import { reify, Type } from 'flow-runtime';

type Options = {
  modulePaths: $ReadOnlyArray<string>,
};

const GQL_MODULE_DIR = path.resolve(__dirname, '../');

type PkgLoadParams<TLoadedPkg> = {|
  prefix: string,
  pkgConfig: PkgConfig,
  extraPkgOptions: $FixMe,
  corePkgs: $ReadOnlyArray<string>,
  validate: (pkg: mixed) => TLoadedPkg,
|};

// eslint-disable-next-line no-use-before-define
type PkgModule = (options: $FixMe, pkgUtils: PkgUtils) => $FixMe;

export default class PkgUtils {
  _options: Options;

  constructor(options: Options) {
    this._options = options;
  }

  import(pkgName: string, isCore: boolean): PkgModule {
    const dirs = isCore ? GQL_MODULE_DIR : this._options.modulePaths;
    const moduleID = isCore ? `./${pkgName}` : pkgName;
    return validatePkgModule(importModule(moduleID, dirs));
  }

  load<TLoadedPkg>(params: PkgLoadParams<TLoadedPkg>): TLoadedPkg {
    const { prefix, pkgConfig } = params;
    const [pkg, options] = this.normalizeConfig(prefix, pkgConfig);
    const isCore = params.corePkgs.includes(pkg);

    try {
      const mod = this.import(pkg, isCore);
      return params.validate(mod(options, this));
    } catch (err) {
      throw new Error(
        `${prefix.toUpperCase()}: Failed to load ${pkg} \n ${err.message}`,
      );
    }
  }

  normalizeConfig(prefix: string, pkgConfig: PkgConfig) {
    return normalizePkgConfig(prefix, pkgConfig);
  }
}

function validatePkgModule(value: mixed): PkgModule {
  const PkgModuleType = (reify: Type<PkgModule>);
  PkgModuleType.assert(value);
  return (value: $FixMe);
}

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
