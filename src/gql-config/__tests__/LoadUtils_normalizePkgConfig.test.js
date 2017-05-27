/* @flow */
import { normalizePkgConfig } from '../LoadUtils';

[
  {
    input: ['prefix', 'pkgname'],
    output: ['prefix-pkgname', {}],
  },
  {
    input: ['prefix', ['pkgname', { option: 'value' }]],
    output: ['prefix-pkgname', { option: 'value' }],
  },
  {
    input: ['prefix', ['prefix-pkgname', { option: 'value' }]],
    output: ['prefix-pkgname', { option: 'value' }],
  },
].forEach(({ input, output }) => {
  const inputStr = `"${input[0]}", ${JSON.stringify(input[1])}`;
  const outputStr = JSON.stringify(output);
  test(`normalizePkgConfig(${inputStr}) == ${outputStr}`, () => {
    expect(normalizePkgConfig(...input)).toEqual(output);
  });
});
