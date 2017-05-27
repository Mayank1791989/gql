/* @flow */
/* eslint-disable max-len */
import { createTempFiles } from 'gql-test-utils/file';
import GQLService from '../GQLService';

test('correctly find all file extensions used in .gqlconfig', async () => {
  const dir = createTempFiles({
    '.gqlconfig': `
      {
        schema: {
          files: 'schema/*.gql',
        },
        query: {
          files: [
            {
              match: 'query/*.graphql',
            },
            {
              match: 'query/*.js',
              parser: 'default',
            },
            {
              match: 'query/*.xyz',
            },
          ]
        }
      }
    `,
    'schema/schema.gql': `
      type Query {
        name: string
      }
    `,
  });

  const gql = new GQLService({
    configDir: dir,
    watch: false,
  });

  gql.onError(err => {
    throw err;
  });

  await gql.start();
  expect(gql.getConfig().getFileExtensions()).toMatchSnapshot();
});
