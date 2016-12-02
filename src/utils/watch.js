/* @flow */
import watchman from 'fb-watchman';
import type { WatchFile } from './types';

const client = new watchman.Client();

export default function watch(
  rootPath: string,
  glob: string,
  callback: (changedFiles: Array<WatchFile>) => void,
) {
  console.log(`Launching watch server for ${rootPath}/${glob}`);
  client.capabilityCheck({ optional: [], required: ['relative_root'] }, (error) => {
    if (error) {
      console.error(error);
      client.end();
      return;
    }

    client.command(['watch-project', rootPath], (err, { watch: _watch, relative_path: relativePath, warning }) => {
      if (err) {
        console.error('Error initiating watch:', err);
        return;
      }

      if (warning) {
        console.log('warning: ', warning);
      }

      const sub = {
        expression: ['allof', ['match', glob, 'wholename']],
        fields: ['name', 'exists', 'type'],
        relative_root: undefined,
      };

      if (relativePath) {
        sub.relative_root = relativePath;
      }

      console.log(`Watch established on ${_watch} relative_path ${relativePath}`);

      const gqlFilesWatchSubscription = 'gqlFilesWatch';
      client.command(['subscribe', _watch, gqlFilesWatchSubscription, sub], (subscribeError, resp) => {
        if (subscribeError) {
          console.error('failed to subscribe: ', subscribeError);
          return;
        }

        console.log(`subsciption ${resp.subscribe} established`);
      });

      client.on('subscription', (resp) => {
        if (resp.subscription !== gqlFilesWatchSubscription) {
          return;
        }
        callback(resp.files);
      });
    });
  });
}

