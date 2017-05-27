/* @flow */
import { normalizePkgName } from '../normalizePkg';

test('should add prefix if missing in pkg name', () => {
  const prefix = 'gql-query-parser';
  const pkg = 'custom';
  expect(normalizePkgName(prefix, pkg)).toEqual(`${prefix}-${pkg}`);
});

test('should not add prefix if already present in pkg name', () => {
  const prefix = 'gql-query-parser';
  const pkg = 'gql-query-parser-custom';
  expect(normalizePkgName(prefix, pkg)).toEqual(pkg);
});

test('should should not add prefix if pkg name is relative file path', () => {
  const prefix = 'gql-query-parser';
  const pkg = './custom';
  expect(normalizePkgName(prefix, pkg)).toEqual(pkg);
});

test('should should not add prefix if pkg name is absolute file path', () => {
  const prefix = 'gql-query-parser';
  const pkg = '/user/custom';
  expect(normalizePkgName(prefix, pkg)).toEqual(pkg);
});

test('should add if prefix is missing in @scope/pkg name', () => {
  const prefix = 'gql-query-parser';
  const scope = '@someorg';
  const pkg = 'custom';
  expect(normalizePkgName(prefix, `${scope}/${pkg}`)).toEqual(
    `${scope}/${prefix}-${pkg}`,
  );
});

test('should not add prefix if already present in @scope/pkg name', () => {
  const prefix = 'gql-query-parser';
  const scope = '@someorg';
  const pkg = 'gql-query-parser-custom';
  expect(normalizePkgName(prefix, `${scope}/${pkg}`)).toEqual(
    `${scope}/${pkg}`,
  );
});
