/* @flow */
/* eslint-disable max-len */
import runGQLService from './runGQLService';

test('correctly find all file extensions used in .gqlconfig', (done) => {
  const gql = runGQLService(
    {
      '/test/.gqlconfig': `
        {
          schema: {
            files: 'schema/*.gql',
          },
          query: {
            files: [
              {
                match: 'query/*.graphql',
                parser: 'QueryParser',
              },
              {
                match: 'query/*.js',
                parser: 'QueryParser',
              },
              {
                match: 'query/*.xyz',
                parser: 'QueryParser',
              },
            ]
          }
        }
      `,
      '/test/schema/schema.gql': `
        type Query {
          name: string
        }
      `,
    },
    {
      cwd: '/test',
      onInit() {
        expect(gql.getFileExtensions()).toMatchSnapshot();
        done();
      },
    },
  );
});
