/* @flow */
import { FSWatcher } from 'chokidar';

export default class ChokidarPatched extends FSWatcher {
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
