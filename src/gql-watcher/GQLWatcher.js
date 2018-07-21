/* @flow */
import boolValue from 'gql-shared/boolValue';
import parseBool from 'gql-shared/parseBool';
import log from 'gql-shared/log';
import noop from 'gql-shared/noop';
import { execSync } from 'child_process';
import { ChokidarWatcher, WatchmanWatcher } from './watcher';

import watch, { type WatchOptions } from './watch';
import { memoizeSingle } from 'gql-shared/memoize';

const logger = log.getLogger('gql-watcher');

type Options = $ReadOnly<{|
  watchman?: boolean,
  watch?: boolean,
|}>;

export default class GQLWatcher {
  _watchers: Map<Object, boolean> = new Map();
  _options: Options;

  constructor(options: Options) {
    this._options = options;
  }

  watch(options: $Diff<WatchOptions, $Exact<{ Watcher: any, watch: any }>>) {
    logger.info(`setting watcher for files ${JSON.stringify(options.files)}`);
    const watcher = watch({
      ...options,
      Watcher: this._getWatcher(
        boolValue(
          this._options.watchman,
          parseBool(process.env.TEST_USE_WATCHMAN || 'true'),
        ),
      ),
      watch: boolValue(this._options.watch, true),
    });

    this._watchers.set(watcher, true);

    return {
      onReady() {
        return watcher.onReady();
      },
      close: () => {
        return watcher.close().then(() => {
          this._watchers.delete(watcher);
        });
      },
    };
  }

  close(): Promise<void> {
    const closePromises = [];
    this._watchers.forEach((_, watcher) => {
      closePromises.push(watcher.close());
    });
    return Promise.all(closePromises).then(noop);
  }

  _getWatcher = memoizeSingle((useWatchmanIfAvailable: boolean) => {
    if (useWatchmanIfAvailable && this._checkWatchmanInstalled()) {
      logger.info('using "watchman" watcher.');
      return WatchmanWatcher;
    }

    logger.info('using "chokidar" watcher.');
    return ChokidarWatcher;
  });

  _checkWatchmanInstalled() {
    logger.info('checking "watchman" version...');
    try {
      const version = execSync('watchman --version', {
        stdio: ['ignore'],
        encoding: 'utf8',
      });
      logger.info(`watchman v${version.toString().trim()} found.`);
      return true;
    } catch (e) {
      logger.info('"watchman" not found.');
      return false;
    }
  }
}
