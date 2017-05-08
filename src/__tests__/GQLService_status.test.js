/* @flow */
/* eslint-disable max-len */
import runGQLService from './runGQLService';

describe('Schema', () => {
  it('should report errors in schema', (done) => {
    const gql = runGQLService(
      {
        '/test/.gqlconfig': `
          {
            schema: {
              files: 'schema/*.gql',
            }
          }
        `,
        '/test/schema/schema.gql': `
          type Query {
            viewer: xViewer # missing viewer
          }
      `,
      },
      {
        cwd: '/test',
        onInit() {
          expect(gql.status()).toMatchSnapshot();
          done();
        },
      },
    );
  });

  it('can modify validation rule severity', (done) => {
    const gql = runGQLService(
      {
        '/test/schema/schema.gql': `
          type Query {
            name: String
          }
          type Hello {
            name: String
          }
        `,
        '/test/.gqlconfig': `{
          schema: {
            files: 'schema/*.gql',
            validate: {
              extends: 'gql-rules-schema',
              rules: {
                NoUnusedTypeDefinition: 'error',
              },
            }
          }
        }`,
      },
      {
        cwd: '/test',
        onInit: () => {
          expect(gql.status()).toMatchSnapshot();
          done();
        },
      },
    );
  });

  it('calling status before onInit should not throw', () => {
    const gql = runGQLService(
      {
        '/test/.gqlconfig': `
          {
            schema: {
              files: 'schema/*.gql',
            }
          }
        `,
        '/test/schema/schema.gql': `
          type Query {
            viewer: xViewer # missing viewer
          }
      `,
      },
      {
        cwd: '/test',
      },
    );
    expect(() => gql.status()).not.toThrow();
    expect(gql.status()).toEqual([]);
  });

  it('can turn off validation rules', (done) => {
    const gql = runGQLService(
      {
        '/test/schema/schema.gql': `
          type Query {
            name: String
          }
          type Hello {
            name: String
          }
        `,
        '/test/.gqlconfig': `{
          schema: {
            files: 'schema/*.gql',
            validate: {
              extends: 'gql-rules-schema',
              rules: {
                NoUnusedTypeDefinition: 'off',
              },
            }
          }
        }`,
      },
      {
        cwd: '/test',
        onInit: () => {
          expect(gql.status()).toMatchSnapshot();
          done();
        },
      },
    );
  });
});

describe('Query', () => {
  it('report query errors', (done) => {
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
                  match: 'query/*.gql',
                  parser: 'QueryParser',
                }
              ]
            }
          }
        `,
        '/test/schema/schema.gql': `
          type Query {
            viewer: Viewer
          }
          type Viewer {
            name: String
          }
        `,
        '/test/query/query.gql': `
          query {
            xViewer {
              name
            }
          }
        `,
      },
      {
        cwd: '/test',
        onInit: () => {
          expect(gql.status()).toMatchSnapshot();
          done();
        },
      },
    );
  });
});
