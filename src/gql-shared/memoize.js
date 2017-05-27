/* @flow */
/* global T */
import _memoize from 'lodash/memoize';

function memoize<T: Function>(fn: T, resolver?: Function): T {
  return _memoize(fn, resolver);
}

class SingleItemCache {
  _key = null;
  _value = null;

  has(key: mixed) {
    return this._key === key;
  }

  get() {
    return this._value;
  }

  set(key: mixed, value: mixed) {
    this._key = key;
    this._value = value;
    return this; // NOTE: 'this' should be returned
  }

  // eslint-disable-next-line no-empty-function
  delete() {}
}
// will cache only one value
function memoizeSingle<T: Function>(fn: T, resolver?: Function): T {
  const memoized = memoize(fn, resolver);
  memoized.cache = new SingleItemCache();
  return memoized;
}

export default memoize;
export { memoize, memoizeSingle };
