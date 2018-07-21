/* @flow */
import EventsEmitter from 'events';
import common from 'sane/src/common';
import ChokidarPatched from './ChokidarPatched';
import fs from 'fs';
import sysPath from 'path';
import { type IWatcher, type IWatcherOptions } from './types';
import parseBool from 'gql-shared/parseBool';
import anymatch from 'anymatch';
import globParent from 'glob-parent';
import normalizePath from 'normalize-path';
import { memoizeSingle } from 'gql-shared/memoize';

export default class ChokidarWatcher extends EventsEmitter implements IWatcher {
  _watcher: ChokidarPatched;
  root: string;

  constructor(dir: string, opts: IWatcherOptions) {
    super();
    this.root = dir;
    this.opts = opts;
    this._watcher = this._setupWatcher(dir, opts);
  }

  close(callback: () => void) {
    this._watcher.close();
    if (callback) {
      setImmediate(callback.bind(null, null, true));
    }
  }

  _emit = (eventType: string, path: string, stat: ?fs.Stats) => {
    this.emit(eventType, path, this.root, stat);
    this.emit(common.ALL_EVENT, eventType, path, this.root, stat);
  };

  _getCheckIgnored = memoizeSingle((opts: IWatcherOptions) => {
    const toAbsoluteGlobs = glob => {
      return toArray(glob).map(gl => {
        return normalizePath(sysPath.join(this.root, gl));
      });
    };
    const includeFilesGlob = toAbsoluteGlobs(opts.glob);
    const globParentPathGlob = includeFilesGlob.reduce((acc, glob) => {
      // NOTE: we always use forward slash
      const parentDir = globParent(glob);
      acc.push(parentDir, `${parentDir}/**`);
      return acc;
    }, []);

    type PathMatcher = (path: string) => boolean;

    const isIgnored: PathMatcher = opts.ignored
      ? anymatch(toAbsoluteGlobs(opts.ignored))
      : () => false;

    const isFileIncluded: PathMatcher = anymatch(includeFilesGlob);

    // 1) tester/test/**/*.js will return true for all path inside "tester/test"
    //    test/test/dirA, test/test/dirA/file.css will match
    //    but tester/testB/test.js will not match
    // 2) tester/dirA/**/dirB/*.js will match all paths(file or dir) which are inside "tester/dirA"
    const isPathInsideGlobParent: PathMatcher = anymatch(globParentPathGlob);

    const checkPathCanBeSafelyIgnored: PathMatcher = (path: string) => {
      // user ignored
      if (isIgnored(path)) {
        return true;
      }
      return !isPathInsideGlobParent(path);
    };

    // Chokidar call this func twice one without stat (before calling fs stat) and one with stat
    // Perf: as this func is called before calling fs.stat so if we can ignore some path without "stat"
    // it always better as it will save fs.stat call
    // NOTE: fs_events watcher: in some cases func is called only once without stat so some ignored files
    // can pass this func see below handleFunc which again matches path (there we always have stat)
    // to fix this
    return (path: string, stat: ?fs.Stats) => {
      // NOTE: issue in blindly matching all path against opt.glob
      // -> match("test/**/*.js", "test/dirA/a.js") is true
      // -> but match("test/**/*.js", "test/dirA") is false
      // above we can see opts.glob will never match dirs path
      // and if we use on dir path chokidar will ignore that dir (including all files inside it)
      // which is wrong as that dir can contain matching files (in above case a.js).
      // So below if for sure we know 'path' is file path then only using opts.glob to match
      // else not ignoring the path (return false). This will not cause issue as later when this func
      // is called with file inside dir it will be matched with opts.glob.
      // Perf: blindly returning false for all dir path can cause lot of unneccessory fs reads and watchers
      // so below returning true if for sure we find that path (or any sub dir|file in path)
      // will never match opts.glob
      if (checkPathCanBeSafelyIgnored(path)) {
        return true;
      }

      if (stat && stat.isFile()) {
        return !isFileIncluded(path);
      }

      // We can't safely ignore this path
      return false;
    };
  });

  _setupWatcher = (dir: string, opts: IWatcherOptions) => {
    const pathsToWatch = toArray(opts.glob).map(glob => {
      return globParent(glob);
    });

    // NOTE: Chokidar misses lot of events if we use file globs in add (test/**/*.js)
    // so not using chokidar globbing
    //  - disablingGlobbing
    //  - using '.' in add
    //  - using custom ignored function which will handle opts.Glob
    const chokidarWatcher = new ChokidarPatched({
      ignored: this._getCheckIgnored(opts),
      ignoreInitial: true,
      cwd: dir,
      alwaysStat: true,
      disableGlobbing: true,
      useFsEvents: process.env.TEST_USE_FS_EVENTS
        ? parseBool(process.env.TEST_USE_FS_EVENTS)
        : undefined,
    }).add(pathsToWatch);

    return chokidarWatcher
      .on('ready', () => {
        this.emit('ready');
      })
      .on('add', this._handleAdd)
      .on('addDir', this._handleAdd)
      .on('change', this._handleChange)
      .on('unlink', this._handleDelete)
      .on('unlinkDir', this._handleDelete);
  };

  _isIgnored = (path, stat) => {
    return this._getCheckIgnored(this.opts)(path, stat);
  };

  _handleAdd = (path: string, stat: ?fs.Stats) => {
    // there are some cases when event is triggered on non-watched files
    if (!this._isIgnored(this._absolutePath(path), stat)) {
      this._emit(common.ADD_EVENT, path, stat);
    }
  };

  _handleChange = (path: string, stat: ?fs.Stats) => {
    // there are some cases when event is triggered on non-watched files
    if (!this._isIgnored(this._absolutePath(path), stat)) {
      this._emit(common.CHANGE_EVENT, path, stat);
    }
  };

  _handleDelete = (path: string) => {
    this._emit(common.DELETE_EVENT, path);
  };

  _absolutePath = (path: string) => {
    return normalizePath(sysPath.join(this.root, path));
  };
}

function toArray(val) {
  return Array.isArray(val) ? val : [val];
}
