/* @flow */
import EventsEmitter from 'events';
import * as chokidar from 'chokidar';
import common from 'sane/src/common';
import fs from 'fs';
import sysPath from 'path';
import { type IWatcher, type IWatcherOptions } from './types';
import parseBool from 'gql-shared/parseBool';

export default class ChokidarWatcher extends EventsEmitter implements IWatcher {
  _watcher: chokidar.FSWatcher;
  root: string;

  constructor(dir: string, opts: IWatcherOptions) {
    super();
    this.root = dir;
    this._watcher = this._setupWatcher(dir, opts);
  }

  close(callback: Function) {
    this._watcher.close();
    if (callback) {
      setImmediate(callback.bind(null, null, true));
    }
  }

  _emit = (eventType: string, path: string, stat: ?fs.Stats) => {
    this.emit(eventType, path, this.root, stat);
    this.emit(common.ALL_EVENT, eventType, path, this.root, stat);
  };

  _setupWatcher = (dir: string, opts: IWatcherOptions) => {
    const chokidarWatcher = new ChokidarPatched({
      ignored: opts.ignored,
      ignoreInitial: true,
      cwd: dir,
      alwaysStat: true,
      useFsEvents: process.env.TEST_USE_FS_EVENTS
        ? parseBool(process.env.TEST_USE_FS_EVENTS)
        : undefined,
    }).add(opts.glob);

    return withFixForMissingRemoveEvent(chokidarWatcher)
      .on('ready', () => {
        this.emit('ready');
      })
      .on('add', this._handleAdd)
      .on('addDir', this._handleAdd)
      .on('change', this._handleChange)
      .on('unlink', this._handleDelete)
      .on('unlinkDir', this._handleDelete);
  };

  _handleAdd = (path: string, stat: ?fs.Stats) => {
    this._emit(common.ADD_EVENT, path, stat);
  };

  _handleChange = (path: string, stat: ?fs.Stats) => {
    this._emit(common.CHANGE_EVENT, path, stat);
  };

  _handleDelete = (path: string) => {
    this._emit(common.DELETE_EVENT, path);
  };
}

// Patch watcher to fix missing 'remove' event when dir renamed (only add event is called)
function withFixForMissingRemoveEvent(watcher) {
  watcher.on('raw', (rawEvent, file, info) => {
    console.log('rawEvent', rawEvent, file, info);

    // watchedPath not present in case of 'fsevents'
    if (!info.watchedPath) {
      // NOTE: patch only required when nodefs used (not fsevents).
      return;
    }

    if (rawEvent === 'rename') {
      // sometime event called on path with file and sometime with path and invalid file
      const filePath = sysPath.join(info.watchedPath, file);
      [filePath, info.watchedPath].forEach(itemPath => {
        if (watcher._watched[itemPath]) {
          fs.exists(itemPath, exists => {
            if (!exists) {
              // if dir not exist
              const directory = sysPath.dirname(itemPath);
              const item = sysPath.basename(itemPath);
              // remove watcher
              watcher._remove(directory, item);
            }
          });
        }
      });
    }
  });

  return watcher;
}

class ChokidarPatched extends chokidar.FSWatcher {
  constructor(opts) {
    super(opts);
    this._closers = this._fixMultiClosersLost(this._closers);
  }

  // TEMP_FIX: node process not exiting after watcher.close()
  // ISSUE: some fs.watch watchers are not closed
  // Chokidar overriding old closer function with new one
  // and fs.watch is removed only if all closers are called
  // causing watcher to stay open when multi closer (listener) added on same path
  // Below is temp fix to keep all closers and call all closers to successfully
  // close fs.watch
  _fixMultiClosersLost = closers => {
    return new Proxy(closers, {
      get(target, key) {
        return target[key];
      },
      set(obj, key, closeFn) {
        if (!obj[key]) {
          const multiCloseFn = () => {
            multiCloseFn.fns.forEach(closer => closer());
          };
          multiCloseFn.fns = [];
          obj[key] = multiCloseFn;
        }
        obj[key].fns.push(closeFn);
        return true;
      },
    });
  };
}
