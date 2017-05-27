/* @flow */
import { dedent } from 'dentist';

type FilesMap = { [path: string]: string };

export function dedentFiles(files?: FilesMap): FilesMap {
  if (!files) {
    return {};
  }
  return Object.keys(files).reduce((acc, path) => {
    acc[path] = dedent(files[path]);
    return acc;
  }, {});
}
