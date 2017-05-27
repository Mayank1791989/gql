/* @flow */
import code from 'gql-test-utils/code';
import path from 'path';
import { createTempFiles } from 'gql-test-utils/file';
import { getSchemaFiles } from 'gql-test-utils/test-data';
import GQLService from 'gql-service';

describe('autocomplete', () => {
  it('fragments', async () => {
    const { gql, rootDir } = createService({
      'files/a.graphql': `
        fragment UserFragA on Player {
          name
        }
      `,
      'files/b.graphql': `
        fragment UserFragB on Player {
          id
        }
    `,
    });
    await gql.start();

    const hints = await gql.autocomplete({
      sourcePath: path.join(rootDir, 'files/c.graphql'),
      ...code(`
        fragment UserFragC on Player {
          name
          ...
         #--^
        }
      `),
    });

    expect(hints).toMatchInlineSnapshot(`
Array [
  Object {
    "description": "fragment UserFragA on Player",
    "text": "UserFragA",
    "type": "Player",
  },
  Object {
    "description": "fragment UserFragB on Player",
    "text": "UserFragB",
    "type": "Player",
  },
]
`);

    await gql.stop();
  });
});

function createService(files: { [filePath: string]: string }) {
  const rootDir = createTempFiles({
    '.gqlconfig': `
        {
          schema: {
            files: ['schema/*.gql', 'schema/**/*.graphql'],
            graphQLOptions: {
              commentDescriptions: true
            },
          },
          query: {
            files: [
              {
                match: 'files/**/*.graphql',
                presets: ['apollo-graphql'],
              },
            ]
          }
        }
      `,
    ...getSchemaFiles(),
    ...files,
  });

  const gql = new GQLService({
    configDir: rootDir,
    watch: false,
  });
  gql.onError(err => {
    throw err;
  });

  return { gql, rootDir };
}
