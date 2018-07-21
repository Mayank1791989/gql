/* @flow */
/* eslint-disable no-sync */
import GQLWatcher from '../GQLWatcher';
import { createTempFiles } from 'gql-test-utils/file';
import path from 'path';
import fs from 'fs-extra';

async function setupWatcher(onChange: Function) {
  const rootPath = createTempFiles({
    // Putting Date.now() to create diff directory every time test run
    // we can also run tests in parallel.
    '.git/tmp': `to trigger watchman events. ${Date.now()}`,
    'watchdir/dirA/fileA': 'fileA',
    'watchdir/dirA/fileB.js': 'fileB.js',
    'watchdir/dirA/fileC.js': 'fileC.js',
    'watchdir/dirA/fileD.js': 'fileD.js',
    'outsidewatchdir/dirA/fileA.js': 'fileA.js',
  });

  const watcher = new GQLWatcher({ watch: true });
  const watchSubscription = watcher.watch({
    rootPath,
    files: 'watchdir/**/*.js',
    onChange: files => {
      const sortedFiles = files.sort((a, b) => {
        if (a.name > b.name) {
          return 1;
        }
        return -1;
      });
      onChange(sortedFiles);
    },
  });

  await watchSubscription.onReady();
  return { rootPath, watcher };
}

describe('add', () => {
  test('add file triggers add event', async () => {
    const onChangeMock = jest.fn();
    const { rootPath, watcher } = await setupWatcher(onChangeMock);
    // create file
    await fs.outputFile(
      path.join(rootPath, 'watchdir/dirA/fileX.js'),
      'fileX.js',
    );
    await waitForFsEvents();

    expect(onChangeMock.mock.calls).toMatchSnapshot();

    await watcher.close();
  });

  test('add file in new dir triggers add event', async () => {
    const onChangeMock = jest.fn();
    const { rootPath, watcher } = await setupWatcher(onChangeMock);
    // create file
    await fs.outputFile(
      path.join(rootPath, 'watchdir/dirB/fileA.js'),
      'fileA.js',
    );
    // wait for all events called
    await waitForFsEvents();

    expect(onChangeMock.mock.calls).toMatchSnapshot();

    await watcher.close();
  });

  test('add file outside watch root should not trigger add event', async () => {
    const onChangeMock = jest.fn();
    const { rootPath, watcher } = await setupWatcher(onChangeMock);

    // create file
    await fs.outputFile(
      path.join(rootPath, 'outsidewatchdir/dirA/fileX.js'),
      'fileX.js',
    );

    // wait for all events called
    await waitForFsEvents();

    expect(onChangeMock.mock.calls).toMatchSnapshot();

    await watcher.close();
  });

  test('add dir should not trigger add event', async () => {
    const onChangeMock = jest.fn();
    const { rootPath, watcher } = await setupWatcher(onChangeMock);

    // create file
    await fs.mkdirp(path.join(rootPath, 'watchdir/dirB'));

    // wait for all fs events called
    await waitForFsEvents();

    expect(onChangeMock.mock.calls).toMatchSnapshot();

    await watcher.close();
  });
});

describe('delete', () => {
  test('file delete trigger delete event on deleted file', async () => {
    const onChangeMock = jest.fn();
    const { rootPath, watcher } = await setupWatcher(onChangeMock);

    await fs.remove(path.join(rootPath, 'watchdir/dirA/fileB.js'));
    await waitForFsEvents();

    expect(onChangeMock.mock.calls).toMatchSnapshot();

    await watcher.close();
  });

  test('directory delete should trigger delete event on all files inside deleted dir', async () => {
    const onChangeMock = jest.fn();
    const { rootPath, watcher } = await setupWatcher(onChangeMock);

    await fs.remove(path.join(rootPath, 'watchdir/dirA'));
    await waitForFsEvents();

    expect(onChangeMock.mock.calls).toMatchSnapshot();

    await watcher.close();
  });

  test('directory delete outside root should not trigger event', async () => {
    const onChangeMock = jest.fn();
    const { rootPath, watcher } = await setupWatcher(onChangeMock);

    await fs.remove(path.join(rootPath, 'outsidewatchdir/dirA'));
    await waitForFsEvents();

    expect(onChangeMock.mock.calls).toMatchSnapshot();

    await watcher.close();
  });
});

describe('move (rename)', () => {
  test('rename file should trigger two events delete and add', async () => {
    const onChangeMock = jest.fn();
    const { rootPath, watcher } = await setupWatcher(onChangeMock);

    await fs.move(
      path.join(rootPath, 'watchdir/dirA/fileB.js'),
      path.join(rootPath, 'watchdir/dirA/fileBB.js'),
    );
    await waitForFsEvents();

    expect(onChangeMock.mock.calls).toMatchSnapshot();

    await watcher.close();
  });

  test('move file from one dir to other dir should trigger two events delete and add', async () => {
    const onChangeMock = jest.fn();
    const { rootPath, watcher } = await setupWatcher(onChangeMock);

    await fs.move(
      path.join(rootPath, 'watchdir/dirA/fileB.js'),
      path.join(rootPath, 'watchdir/dirB/fileB.js'),
    );
    await waitForFsEvents();

    expect(onChangeMock.mock.calls).toMatchSnapshot();

    await watcher.close();
  });

  test.only('rename dir should trigger two events delete and add for all files inside dir', async () => {
    const onChangeMock = jest.fn();
    const { rootPath, watcher } = await setupWatcher(onChangeMock);

    await fs.move(
      path.join(rootPath, 'watchdir/dirA'),
      path.join(rootPath, 'watchdir/dirC'),
    );
    await waitForFsEvents();

    // console.log(JSON.stringify(onChangeMock.mock.calls, null, 2));
    expect(onChangeMock.mock.calls).toMatchSnapshot();

    await watcher.close();
  });

  // When sync is used fs events emitted are different
  test('[using sync] rename dir should trigger two events delete and add for all files inside dir', async () => {
    const onChangeMock = jest.fn();
    const { rootPath, watcher } = await setupWatcher(onChangeMock);

    fs.moveSync(
      path.join(rootPath, 'watchdir/dirA'),
      path.join(rootPath, 'watchdir/dirC'),
    );
    await waitForFsEvents();

    // console.log(JSON.stringify(onChangeMock.mock.calls, null, 2));
    expect(onChangeMock.mock.calls).toMatchSnapshot();

    await watcher.close();
  });
});

function waitForFsEvents(): Promise<void> {
  return wait(1000);
}

function wait(timeInMsec: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, timeInMsec);
  });
}
