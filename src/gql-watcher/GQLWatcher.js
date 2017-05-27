/* @flow */
import boolValue from 'gql-shared/boolValue';
import log from 'gql-shared/log';
import sane from 'sane';
import os from 'os';
import { execSync } from 'child_process';

import watch, { type WatchOptions } from './watch';
import { memoizeSingle } from 'gql-shared/memoize';
import { type IWatcher } from './types';

const logger = log.getLogger('gql-watcher');

type Options = $ReadOnly<{|
  watchman?: boolean,
  watch?: boolean,
|}>;

export default class GQLWatcher {
  _watchers: Array<*> = [];
  _options: *;

  constructor(options: Options) {
    this._options = options;
  }

  watch(options: $Rest<WatchOptions, {| Watcher: any, watch: any |}>) {
    logger.info(`setting watcher for files ${JSON.stringify(options.files)}`);
    const watcher = watch({
      ...options,
      Watcher: this._getWatcher(boolValue(this._options.watchman, true)),
      watch: boolValue(this._options.watch, true),
    });
    this._watchers.push(watcher);
    return watcher;
  }

  close() {
    this._watchers.forEach(watcher => {
      watcher.close();
    });
  }

  _getWatcher = memoizeSingle((useWatchmanIfAvailable: boolean): Class<
    IWatcher,
  > => {
    if (useWatchmanIfAvailable && this._checkWatchmanInstalled()) {
      logger.info('using "watchman" watcher.');
      return sane.WatchmanWatcher;
    }

    if (os.platform() === 'darwin') {
      logger.info('using "fsevents" watcher.');
      return sane.FSEventWatcher;
    }

    logger.info('using "node" watcher.');
    return sane.NodeWatcher;
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
