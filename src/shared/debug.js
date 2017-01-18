/* @flow */
const noop = () => {};
const debug = new Proxy(console, {
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
