/* @flow */
import mkdirp from 'mkdirp';
import fs from 'fs';
import path from 'path';

export function mkdirpSync(dir: string) {
  mkdirp.sync(dir, { fs });
}

export function writeFileSync(file: string, content: string) {
  const dir = path.dirname(file);
  // make sure dir exists
  mkdirpSync(dir);
  fs.writeFileSync(file, content);
}
