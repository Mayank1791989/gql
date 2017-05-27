/* @flow */
import GQLService from '../../GQLService';
import { createTempFiles } from 'gql-test-utils/file';

test('calling status before onInit should not throw', () => {
  const gql = new GQLService({
    configDir: createTempFiles({
      '.gqlconfig': `
          {
            schema: {
              files: 'schema/*.gql',
            }
          }
        `,
      'schema/schema.gql': `
          type Query {
            viewer: xViewer # missing viewer
          }
        `,
    }),
    watch: false,
  });
  gql.onError(err => {
    throw err;
  });

  expect(() => gql.status()).not.toThrow();
});
