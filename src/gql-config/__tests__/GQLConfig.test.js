/* @flow */
import GQLConfig from '../GQLConfig';
import { createTempFiles } from 'gql-test-utils/file';

test('missing-gqlConfig: Report error if gqlconfig not found', () => {
  expect(() => {
    // eslint-disable-next-line no-unused-vars
    const gqlConfig = new GQLConfig({
      configDir: createTempFiles({
        somefile: '',
      }),
    });
  }).toThrowErrorMatchingInlineSnapshot(
    // eslint-disable-next-line playlyfe/babel-quotes
    `"Could not find a '.gqlconfig' file. Make sure '.gqlconfig' file exists in project root directory."`,
  );
});
