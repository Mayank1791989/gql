/* @flow */
/**
 * fs mock will emulate fs api but everything in memory.
 */
import MemoryFileSystem from 'memory-fs';
import path from 'path';
import EventEmitter from 'gql-shared/emitter';

const KEEP_WATCH_RUNNING_TIME = 60 * 60 * 1000;

function createNewMemoryFileSystem(): MemoryFileSystem {
  const _fs = new MemoryFileSystem();
  const _emitter = new EventEmitter();
  const wrapMethodForWatcher = (name: string, method: Function) => {
    // NOTE: only patching Sync
    // as memory-fs internally calling Sync method to do actual
    // task and will result in calling watch event twice
    if (name.endsWith('Sync')) {
      return (...args) => {
        const result = method(...args);
        setImmediate(() => {
          _emitter.emit('watch', 'change', args[0]);
        });
        return result;
      };
    }
    return method;
    // async
    // return (...args) => {
    //   const lastItemIndex = args.length - 1;
    //   const callback = args[lastItemIndex];
    //   args[lastItemIndex] = (err, result) => {
    //     if (err) {
    //       callback(err);
    //       return;
    //     }

    //     _emitter.emit('watch', 'change', args[0]);
    //     callback(err, result);
    //   };
    //   method(...args);
    // };
  };
  const methodsToWrapForWatcher = {
    mkdirpSync: true,
    mkdirSync: true,
    rmdirSync: true,
    unlinkSync: true,
    writeFileSync: true,
    mkdirp: true,
    rmdir: true,
    unlink: true,
    mkdir: true,
    writeFile: true,
  };

  Object.keys(MemoryFileSystem.prototype).forEach(key => {
    if (typeof _fs[key] === 'function') {
      // Note: binding all methods of _fs
      // some libs use individual fs method
      // e.g const writeFileSync = fs.writeFileSync
      //  writeFileSync() // this will call method with wrong this
      // happening in find-config package
      _fs[key] = _fs[key].bind(_fs);
      if (methodsToWrapForWatcher[key]) {
        // memory-fs doesnt support fs.watch
        // so patching func for fs.watch
        _fs[key] = wrapMethodForWatcher(key, _fs[key]);
      }
    }
  });

  _fs.lstat = _fs.stat;
  _fs.lstatSync = _fs.stateSync;

  _fs.watch = (dir, options, callback) => {
    const subscription = _emitter.addListener('watch', (event, _path) => {
      if (path.dirname(_path) === dir) {
        callback(event, path.relative(dir, _path)); // eslint-disable-line callback-return
      }
    });

    const timeoutId = setTimeout(() => {
      console.log(
        'this setTimeout will emulate watcher long lived process behaviour',
      );
    }, KEEP_WATCH_RUNNING_TIME);

    return {
      close: () => {
        clearTimeout(timeoutId);
        subscription.remove();
      },
    };
  };

  return _fs;
}

const fs = createNewMemoryFileSystem();

module.exports = fs;
