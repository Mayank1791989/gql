/* @flow */
import globby from 'globby';
import _debounce from 'lodash/debounce';
import { type FileMatchConfig } from 'gql-config/types';
import parseFileMatchConfig from 'gql-config/parseFileMatchConfig';
import { type IWatcher, type WatchFile } from './types';
import boolValue from 'gql-shared/boolValue';

export type WatchOptions = {|
  rootPath: string,
  files: FileMatchConfig,
  Watcher: Class<IWatcher>,
  watch: boolean,
  onChange: (changedFiles: Array<WatchFile>) => void,
|};

export default function watch(options: WatchOptions) {
  const { glob, ignored } = parseFileMatchConfig(options.files);

  let watcher = null;
  const onReadyPromise = globby(glob, { cwd: options.rootPath })
    .then(matches => {
      const watchFiles = matches.map(file => ({ name: file, exists: true }));
      if (!boolValue(options.watch, true)) {
        return watchFiles;
      }
      // if in watchmode then wait for watcher to start
      return new Promise(resolve => {
        watcher = setupWatcher({
          rootPath: options.rootPath,
          onChange: options.onChange,
          Watcher: options.Watcher,
          glob,
          ignored,
        });
        watcher.on('ready', resolve);
      }).then(() => watchFiles);
    })
    .then(watchFiles => {
      options.onChange(watchFiles);
    })
    .catch(err => {
      throw err;
    });

  return {
    onReady(): Promise<void> {
      return onReadyPromise;
    },

    close(): void {
      if (watcher) {
        watcher.close();
      }
    },
  };
}

class WatchEventsBatcher {
  _listener: (files: Array<WatchFile>) => void;
  _queue = [];
  _activeTimeout = null;
  _waitTimeForBatching = 200 /* msec */;

  constructor(listener: (files: Array<WatchFile>) => void) {
    this._listener = listener;
  }

  __dispatchQueue = _debounce(() => {
    const events = this._queue;
    this._queue = [];

    if (events.length === 0) {
      return;
    }

    this._listener(events);
  }, this._waitTimeForBatching);

  add(eventOrEvents: WatchFile | Array<WatchFile>) {
    this._queue.push(
      ...(Array.isArray(eventOrEvents) ? eventOrEvents : [eventOrEvents]),
    );
    this.__dispatchQueue();
  }
}

function setupWatcher({ rootPath, onChange, glob, ignored, Watcher }) {
  const watchEventsBatcher = new WatchEventsBatcher(onChange);

  const watcher = new Watcher(rootPath, {
    glob,
    ignored,
  });

  watcher.on('change', filePath => {
    watchEventsBatcher.add({ name: filePath, exists: true });
  });

  watcher.on('add', filePath => {
    watchEventsBatcher.add({ name: filePath, exists: true });
  });

  watcher.on('delete', filePath => {
    watchEventsBatcher.add({ name: filePath, exists: false });
  });

  return watcher;
}
