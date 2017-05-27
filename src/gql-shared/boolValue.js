/* @flow */
export default function boolValue(
  value: ?boolean,
  defaultValue: boolean,
): boolean {
  return typeof value === 'boolean' ? value : defaultValue;
}
