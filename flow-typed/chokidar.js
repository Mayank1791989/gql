/* @flow */
/* eslint-disable */

import fs from 'fs';

declare module 'chokidar' {
  declare export var FSWatcher: typeof chokidar$FSWatcher;
  declare export function watch(
    paths: string | Array<string>,
    options: chokidar$WatchOptions,
  ): chokidar$FSWatcher;
}

declare type chokidar$WatchOptions = {
  persistent?: boolean,
  ignoreInitial?: boolean,
  cwd?: string,
  alwaysStat?: boolean,
};
declare type chokidar$NodeFSRawEventInfo = $Exact<{ watchedPath: string }>;
declare type chokidar$FSEventsFSRawEventInfo = $Exact<{ path: string }>;

declare function chokidar$On(
  event: 'add' | 'addDir',
  (path: string, stat: ?fs.Stats) => void,
): chokidar$FSWatcher;
declare function chokidar$On(
  event: 'unlink' | 'unlinkDir',
  (path: string) => void,
): chokidar$FSWatcher;
declare function chokidar$On(
  event: 'change',
  (path: string, stat: ?fs.Stats) => void,
): chokidar$FSWatcher;
declare function chokidar$On(
  event: 'error',
  (err: Error) => void,
): chokidar$FSWatcher;
declare function chokidar$On(event: 'ready', () => void): chokidar$FSWatcher;
declare function chokidar$On(
  event: 'raw',
  (
    rawEvent: string,
    path: string,
    info: chokidar$NodeFSRawEventInfo | chokidar$FSEventsFSRawEventInfo,
  ) => void,
): chokidar$FSWatcher;

declare class chokidar$FSWatcher {
  constructor(options: chokidar$WatchOptions): this;
  on: typeof chokidar$On;
  add(paths: string | Array<string>): this;
  unwatch(paths: string | Array<string>): this;
  getWatched(): { [key: string]: Array<string> };
  close(): this;
  // private
  _remove(directory: string, item: string): void;
  _watched: { [path: string]: Object };
}
