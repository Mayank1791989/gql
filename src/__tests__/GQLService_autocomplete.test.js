/* @flow */
import { code } from '../__test-data__/utils';
import runGQLService from './runGQLService';

describe('Schema: autocomplete', () => {
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
            gql.autocomplete({
              sourcePath: '/test/schema/user.gql',
              ...code(`
                type User {
                  viewer: Vi
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

  it('should not throw if called before initialization', () => {
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
      gql.autocomplete({
        sourcePath: '/test/schema/user.gql',
        ...code(`
        type User {
          viewer: Vi
          #---------^
        }
      `),
      });

    expect(run).not.toThrow();
    expect(run()).toEqual([]);
  });
});

describe('Query: autocomplete', () => {
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
            gql.autocomplete({
              sourcePath: '/test/query/user.gql',
              ...code(`
                fragment test on Viewer {
                  na
                 #--^
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
