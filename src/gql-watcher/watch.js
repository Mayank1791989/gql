/* @flow */
import globby from 'globby';
import _debounce from 'lodash/debounce';
import { type FileMatchConfig } from 'gql-config/types';
import parseFileMatchConfig from 'gql-config/parseFileMatchConfig';
import { type WatchFile } from './types';
import { type IWatcher } from './watcher';
import boolValue from 'gql-shared/boolValue';
import normalize from 'normalize-path';

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
  const onReadyPromise = globby(glob, {
    cwd: options.rootPath,
    // eslint-disable-next-line no-nested-ternary
    ignore: ignored ? (typeof ignored === 'string' ? [ignored] : ignored) : [],
  })
    .then(matches => {
      const filesMap: Map<string, boolean> = new Map();
      const watchFiles = matches.map(file => {
        filesMap.set(file, true);
        return { name: file, exists: true };
      });
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
          filesMap,
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

    close(): Promise<void> {
      return new Promise(resolve => {
        if (watcher) {
          watcher.close(resolve);
        } else {
          resolve();
        }
      });
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

  add(eventOrEvents: WatchFile | Array<WatchFile>) {
    this._queue.push(
      ...(Array.isArray(eventOrEvents) ? eventOrEvents : [eventOrEvents]),
    );
    this.__dispatchQueue();
  }

  // will merge|remove duplicate events
  __normalizeEvents = events => {
    // NOTE: using map to preserve events order
    const eventsByNameMap: Map<string, WatchFile> = new Map();
    events.forEach(event => {
      eventsByNameMap.set(event.name, event);
    });
    return Array.from(eventsByNameMap.values());
  };

  __dispatchQueue = _debounce(() => {
    const events = this._queue;
    this._queue = [];

    if (events.length === 0) {
      return;
    }

    this._listener(this.__normalizeEvents(events));
  }, this._waitTimeForBatching);
}

function setupWatcher({
  rootPath,
  onChange,
  glob,
  ignored,
  Watcher,
  filesMap,
}) {
  const watchEventsBatcher = new WatchEventsBatcher(onChange);
  const watcher = new Watcher(rootPath, {
    glob,
    ignored,
  });

  watcher.on('change', (filePath, root, stat) => {
    const name = normalize(filePath);
    // console.log('@change', filePath);
    // Filter out events called on directory
    // we dont need them
    if (!stat.isDirectory()) {
      filesMap.set(name, true);
      watchEventsBatcher.add({ name, exists: true });
    }
  });

  watcher.on('add', (filePath, root, stat) => {
    const name = normalize(filePath);
    // console.log('@add', filePath);
    // Filter out events called on directory
    // we dont need them
    if (!stat.isDirectory()) {
      filesMap.set(name, true);
      watchEventsBatcher.add({ name, exists: true });
    }
  });

  watcher.on('delete', deletedFilePath => {
    // NOTE: sometimes watcher delete event is trigged on dir
    // instead of individual files inside that directory
    // below detect and use filesMap to trigger them on files
    // (this happens in windows)
    // console.log('@delete', deletedFilePath);
    const deletedName = normalize(deletedFilePath);

    // Case 1) When trigged on file
    if (filesMap.has(deletedName)) {
      filesMap.delete(deletedName);
      watchEventsBatcher.add({ name: deletedName, exists: false });
    }

    // Case 2) When triggered on directory
    // we have to iterate over existing files list and remove all
    // files starting from "filePath"
    for (const filePath of filesMap.keys()) {
      if (filePath.startsWith(deletedName)) {
        filesMap.delete(filePath);
        watchEventsBatcher.add({ name: filePath, exists: false });
      }
    }
  });

  return watcher;
}
