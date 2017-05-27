/* @flow */
import GQLService from '../GQLService';
import { createTempFiles } from 'gql-test-utils/file';
import { writeFileSync } from 'gql-shared/fs-utils';
import path from 'path';
import invariant from 'invariant';

it('revalidate query files on schema change', async () => {
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
              presets: ['default'],
            }
          ]
        }
      }
    `,
    'schema/query.gql': `
      type Query {
        viewer: Viewer!
      }
    `,
    'schema/viewer.gql': `
      type Viewer {
        xid: String!
      }
    `,
    'query/test.graphql': `
      query Test {
        viewer {
          id
        }
      }
    `,
  });

  const gql = new GQLService({
    configDir: dir,
    watch: true,
  });
  gql.onError(err => {
    throw err;
  });
  await gql.start();

  // unknown id field error
  expect(gql.status()).toMatchSnapshot();

  // fix error
  writeFileSync(
    path.join(dir, 'schema/viewer.gql'),
    `
      type Viewer {
        id: String!
      }
    `,
  );

  // error should be fixed now
  const errors = await new Promise(resolve => {
    invariant(gql._queryService, 'expected queryService to be defined here');
    gql._queryService.onChange(() => {
      resolve(gql.status());
    });
  });

  expect(errors).toEqual([]);

  // stop watcher and service
  await gql.stop();
});
