/* @flow */
export type WatchFile = $ReadOnly<{|
  name: string,
  exists: boolean,
|}>;

export type Watcher = {
  onReady(): Promise<void>,
  close(): Promise<void>,
};
