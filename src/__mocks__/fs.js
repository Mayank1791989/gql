/* @flow */
import MemoryFileSystem from 'memory-fs';
import path from 'path';

function createNewMemoryFileSystem(): MemoryFileSystem {
  const _fs = new MemoryFileSystem();
  // Note: binding all methods of _fs
  // some libs use individual fs method
  // e.g const writeFileSync = fs.writeFileSync
  //  writeFileSync() // this will call method with wrong this
  // happening in find-config package
  Object.keys(MemoryFileSystem.prototype).forEach((key) => {
    if (typeof _fs[key] === 'function') {
      _fs[key] = _fs[key].bind(_fs);
    }
  });
  return _fs;
}

const fs = createNewMemoryFileSystem();

// This is a custom function that our tests can use during setup to create
// files in memory
function __setMockFiles(newMockFiles) {
  Object.keys(newMockFiles).forEach((file) => {
    const dirname = path.dirname(file);
    fs.mkdirpSync(dirname);
    fs.writeFileSync(file, newMockFiles[file], 'utf8');
  });
}

fs.__setMockFiles = __setMockFiles;

module.exports = fs;
