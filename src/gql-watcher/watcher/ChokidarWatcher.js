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
    return withFixForMissingRemoveEvent(
      chokidar.watch(opts.glob, {
        ignored: opts.ignored,
        ignoreInitial: true,
        cwd: dir,
        alwaysStat: true,
        useFsEvents: process.env.TEST_USE_FS_EVENTS
          ? parseBool(process.env.TEST_USE_FS_EVENTS)
          : undefined,
      }),
    )
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
  watcher.on('raw', (rawEvent, _, info) => {
    console.log(rawEvent, _, info);

    // watchedPath not present in case of 'fsevents'
    if (!info.watchedPath) {
      // NOTE: patch only required when nodefs used (not fsevents).
      return;
    }

    if (rawEvent === 'rename' && watcher._watched[info.watchedPath]) {
      fs.stat(info.watchedPath, err => {
        if (err && err.code === 'ENOENT') {
          // if dir not exist
          const directory = sysPath.dirname(info.watchedPath);
          const item = sysPath.basename(info.watchedPath);
          // remove watcher
          watcher._remove(directory, item);
        }
      });
    }
  });

  return watcher;
}
