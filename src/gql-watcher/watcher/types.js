/* @flow */
import { type Globs } from 'gql-config/types';

export type IWatcherOptions = {|
  glob: Globs,
  ignored: ?Globs,
|};

export interface IWatcher {
  constructor(rootPath: string, opts: IWatcherOptions): void;
  on(event: string, listener: Function): any;
  close(callback: Function): void;
}

export type WatchFile = $ReadOnly<{|
  name: string,
  exists: boolean,
|}>;
