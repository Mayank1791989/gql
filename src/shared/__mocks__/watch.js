/* @flow */
import glob from 'glob';

export default function watch({ rootPath, files, onChange }: any) {
  const request = {
    rootPath,
    files: glob
      .sync(files, { cwd: rootPath })
      .map((_name) => ({ name: _name, exists: true })),

    trigger() {
      if (!request.pending) {
        return;
      }
      request.pending = false;
      onChange(request.files);
    },

    pending: true,
  };
  watch.__requests.push(request);

  setImmediate(() => {
    request.trigger();
  });
  return { end: () => {} }; // eslint-disable-line no-empty-function
}

watch.__requests = [];

// force call change
watch.__triggerChange = () => {
  watch.__requests.forEach((request) => {
    request.trigger();
  });
};
