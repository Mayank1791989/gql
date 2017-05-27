/* @flow */
import { type Globs } from 'gql-config/types';

export type IWatcherOptions = {|
  glob: Globs,
  ignored: ?Globs,
|};

export type IWatcherCloseCallback = (value: null, boolVal: true) => void;

export interface IWatcher {
  constructor(rootPath: string, opts: IWatcherOptions): void;
  on(event: string, listener: Function): any;
  close(callback: IWatcherCloseCallback): void;
}

export type WatchFile = $ReadOnly<{|
  name: string,
  exists: boolean,
|}>;
