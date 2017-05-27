/* @flow */
import { type Globs } from 'gql-config/types';

export interface IWatcher {
  constructor(
    rootPath: string,
    options: { glob: Globs, ignored: ?Globs },
  ): IWatcher;

  on(event: string, listener: (filePath: string) => void): void;

  close(): void;
}

export type WatchFile = $ReadOnly<{|
  name: string,
  exists: boolean,
|}>;
