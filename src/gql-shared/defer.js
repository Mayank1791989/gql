/* @flow */
export default function defer<T>(): {
  promise: Promise<T>,
  resolve: T => void,
  reject: () => void,
} {
  const deferred = {};
  deferred.promise = new Promise<T>((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
}
