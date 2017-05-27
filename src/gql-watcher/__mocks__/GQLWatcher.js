/* @flow */
const GQLWatcher = require.requireActual('../GQLWatcher').default;

export default class GQLWatcherMock extends GQLWatcher {
  constructor(options) {
    options.watchman = false;
    super(options);
  }
}
