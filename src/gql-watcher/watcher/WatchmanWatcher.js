/* @flow */
import SaneWatchmanWatcher from 'sane/src/watchman_watcher';
import { type IWatcher } from './types';
const WatchmanWatcher: Class<IWatcher> = SaneWatchmanWatcher;
export default WatchmanWatcher;
