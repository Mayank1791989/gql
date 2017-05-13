/* @flow */
import { code } from '../__test-data__/utils';
import runGQLService from './runGQLService';

describe('Schema: getDef', () => {
  it('works in schema files', (done) => {
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
            viewer: Viewer
          }

          type Viewer {
            name: string
          }
      `,
      },
      {
        cwd: '/test',
        onInit() {
          expect(
            gql.getInfo({
              sourcePath: '/test/schema/user.gql',
              ...code(`
                type User {
                  viewer: Viewer
                  #---------^
                }
              `),
            }),
          ).toMatchSnapshot();
          done();
        },
      },
    );
  });
  it('should not throw if called before onInit', () => {
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
            viewer: Viewer
          }

          type Viewer {
            name: string
          }
      `,
      },
      {
        cwd: '/test',
      },
    );
    const run = () =>
      gql.getInfo({
        sourcePath: '/test/schema/user.gql',
        ...code(`
          type User {
            viewer: Viewer
            #---------^
          }
        `),
      });

    expect(run).not.toThrow();
    expect(run()).toBeUndefined();
  });
});

describe('Query: getDef', () => {
  it('works in query files', (done) => {
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
                },
              ]
            }
          }
        `,
        '/test/schema/schema.gql': `
          type Query {
            viewer: Viewer
          }

          type Viewer {
            name: string
          }
      `,
      },
      {
        cwd: '/test',
        onInit() {
          expect(
            gql.getInfo({
              sourcePath: '/test/query/user.gql',
              ...code(`
                fragment test on Viewer {
                    #-------------^
                  name
                }
              `),
            }),
          ).toMatchSnapshot();
          done();
        },
      },
    );
  });
});
