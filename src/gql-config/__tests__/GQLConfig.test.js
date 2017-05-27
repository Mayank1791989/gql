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
  }).toThrowErrorMatchingSnapshot();
});
