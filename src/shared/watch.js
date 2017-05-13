/* @flow */
import watchman from 'fb-watchman';
import { type WatchFile } from './types';
import { type FileMatchConfig, type Globs } from '../config/GQLConfig';

const globToMatchExpr = (glob: Globs): Array<any> => {
  if (typeof glob === 'string') {
    return ['match', glob, 'wholename'];
  }

  if (glob.length === 1) {
    return ['match', glob[0], 'wholename'];
  }

  // array
  return ['anyof', ...glob.map((g) => ['match', g, 'wholename'])];
};

export function toMatchExpression(match: FileMatchConfig) {
  // GlobPattern | Array<GlobPattern>
  if (typeof match === 'string' || Array.isArray(match)) {
    return globToMatchExpr(match);
  }

  // object form { match, exclude }
  const matchExpr = globToMatchExpr(match.include);
  const ignoreMatchExpr = match.ignore ? globToMatchExpr(match.ignore) : null;

  if (ignoreMatchExpr) {
    return ['allof', matchExpr, ['not', ignoreMatchExpr]];
  }

  return matchExpr;
}

type WatchOptions = {
  rootPath: string,
  files: FileMatchConfig,
  name: string,
  onChange: (changedFiles: Array<WatchFile>) => void,
};

export default function watch(options: WatchOptions) {
  const { rootPath, name, files, onChange } = options;
  // console.log(`Launching watch server for ${rootPath}`);
  const client = new watchman.Client();
  client.capabilityCheck(
    { optional: [], required: ['relative_root'] },
    (error) => {
      if (error) {
        console.error(error);
        client.end();
        return;
      }

      client.command(
        ['watch-project', rootPath],
        (err, { watch: _watch, relative_path: relativePath, warning }) => {
          if (err) {
            console.error('Error initiating watch:', err);
            return;
          }

          if (warning) {
            console.log('warning: ', warning);
          }

          const sub = {
            expression: toMatchExpression(files),
            fields: ['name', 'exists', 'type'],
            relative_root: relativePath, // eslint-disable-line camelcase
          };

          // console.log(`Watch established on ${_watch} ${files}`);

          const gqlFilesWatchSubscription = name;
          client.command(
            ['subscribe', _watch, gqlFilesWatchSubscription, sub],
            (subscribeError, resp) => {
              if (subscribeError) {
                console.error('failed to subscribe: ', subscribeError);
                return;
              }

              // $FlowDisableNextLine
              console.log(
                `[Watch established (${resp.subscribe})] \n\tbasePath: ${_watch} \n\tRelativePath: ${relativePath} \n\tFiles: ${JSON.stringify(files, 2, 2)}`,
              );
            },
          );

          client.on('subscription', (resp) => {
            if (resp.subscription !== gqlFilesWatchSubscription) {
              return;
            }
            onChange(resp.files);
          });
        },
      );
    },
  );
  return client;
}
