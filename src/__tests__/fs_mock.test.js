/* @flow */
import fs from '../__mocks__/fs';

test('fs: watch works', () => {
  fs.mkdirpSync('/test');

  const watchClb = jest.fn();
  const watch = fs.watch('/test', {}, watchClb);

  fs.writeFileSync('/test/test.txt', 'test file');
  fs.writeFile('/test/test2.txt', 'test file', () => {}); // eslint-disable-line no-empty-function

  return new Promise(resolve => {
    setTimeout(() => {
      watch.close();
      resolve();
    }, 300);
  }).then(() => {
    expect(watchClb).toHaveBeenCalledTimes(2);
  });
});
