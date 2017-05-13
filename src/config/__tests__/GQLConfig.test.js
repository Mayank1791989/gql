/* @flow */
import GQLConfig from '../GQLConfig';
import path from 'path';

const fixture = (name) => path.join(__dirname, 'fixtures', name);

test('missing-gqlConfig: Report error if gqlconfig not found', () => {
  expect(() => {
    const gqlConfig = new GQLConfig({ cwd: fixture('no-gqlconfig') }); // eslint-disable-line
  }).toThrowErrorMatchingSnapshot();
});

test('invalid-gqlconfig: validate .gqlconfig file content', () => {
  expect(() => {
    const gqlConfig = new GQLConfig({ cwd: fixture('invalid-gqlconfig') }); // eslint-disable-line
  }).toThrowErrorMatchingSnapshot();
});

test('only-schema-gqlconfig: allow only schema', () => {
  expect(() => {
    const gqlConfig = new GQLConfig({ cwd: fixture('only-schema-gqlconfig') }); // eslint-disable-line
  }).not.toThrowError();
});

describe('config.match', () => {
  const gqlConfig = new GQLConfig({ cwd: fixture('valid-gqlconfig') });
  const genPath = (file) => fixture(`valid-gqlconfig/${file}`);

  test('match schema files', () => {
    expect(
      gqlConfig.match(genPath('schema/player.gql')),
    ).toMatchSnapshot();
  });

  test('match query files', () => {
    expect(
      gqlConfig.match(genPath('query/player_query.gql')),
    ).toMatchSnapshot();
  });

  test('dont match ignored files', () => {
    expect(
      gqlConfig.match(genPath('query/ignore/player_query.js')),
    ).toBeNull();
  });
});
