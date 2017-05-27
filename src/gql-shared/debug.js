/* @flow */
import noop from './noop';

type Debug = { enable: () => void } & typeof console;

const debug: Debug = new Proxy(console, {
  _isEnabled: false,
  get(target, key) {
    if (key === 'enable') {
      this._isEnabled = true;
      return noop;
    }
    return this._isEnabled ? target[key] : noop;
  },
});

export default debug;
