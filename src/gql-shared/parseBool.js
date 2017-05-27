/* @flow */
import invariant from 'invariant';

export default function parseBool(value: string): boolean {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return invariant(
    false,
    `Expected value to be 'true' or 'false' got '${value}'`,
  );
}
