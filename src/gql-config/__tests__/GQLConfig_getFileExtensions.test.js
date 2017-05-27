/* @flow */
import GQLConfig from '../GQLConfig';
import { createTempFiles } from 'gql-test-utils/file';

test('getFileExtensions: detect different file extensions', () => {
  // eslint-disable-next-line no-unused-vars
  const gqlConfig = new GQLConfig({
    configDir: createTempFiles({
      '.gqlconfig': `
          {
            schema: {
              files: ['js/schema/**/*.gql', 'js/schema/**/*.graphql']
            },
            query: {
              files: [
                { match: 'js/files/*.js' },
                {
                  match: [
                    'js/files/*.jsx',
                    'js/file/*.ts',
                    'files/*.go'
                  ]
                },
                {
                  match: {
                    include: 'files/*.py',
                  }
                },
                {
                  match: {
                    include: ['files/*.java', 'files/*.rb'],
                  }
                },
              ]
            }
          }
        `,
    }),
  });

  expect(gqlConfig.getFileExtensions()).toMatchInlineSnapshot(`
Array [
  "gql",
  "graphql",
  "js",
  "jsx",
  "ts",
  "go",
  "py",
  "java",
  "rb",
]
`);
});
