/* @flow */
import glob from 'glob';

export default function watch({ rootPath, files, onChange }: any) {
  watch.__files = glob.sync(files, { cwd: rootPath }).map(_name => ({ name: _name, exists: true }));
  watch.__onChangeCallback = onChange;
  return { end: () => {} };
}

watch.__triggerChange = (files) => {
  watch.__onChangeCallback(files || watch.__files);
};
