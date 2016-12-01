/* @flow */
import glob from 'glob';

export default function watch(rootPath: string, pattern: string, callback: Function) {
  watch.__files = glob.sync(pattern, { cwd: rootPath }).map(name => ({ name, exists: true }));
  watch.__onChangeCallback = callback;
}

watch.__triggerChange = (files) => {
  watch.__onChangeCallback(files || watch.__files);
};
