/* @flow */
export default function ObjectValues<+TValue: Object>(
  value: TValue,
): Array<$Values<TValue>> {
  return (Object.values(value): $FixMe);
}
