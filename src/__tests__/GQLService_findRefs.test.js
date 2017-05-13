/* @flow */
import { code } from '../__test-data__/utils';
import runGQLService from './runGQLService';

test('findRefs should return all references of token at given position', (done) => {
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
          gql.findRefs({
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

test('should not throw if called before onInit', () => {
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
    gql.findRefs({
      sourcePath: '/test/schema/user.gql',
      ...code(`
        type User {
          viewer: Viewer
          #---------^
        }
      `),
    });

  expect(run).not.toThrow();
  expect(run()).toEqual([]);
});
