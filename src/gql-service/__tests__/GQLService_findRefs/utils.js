/* @flow */
import path from 'path';
import { getSchemaFiles, sortRefs, getAllRefs } from 'gql-test-utils/test-data';
import { createTempFiles } from 'gql-test-utils/file';
import { type GQLPosition } from 'gql-shared/types';
import GQLService from '../../GQLService';

export async function findRefs(params: {
  sourceText: string,
  sourcePath: string,
  position: GQLPosition,
}) {
  const rootDir = createTempFiles({
    '.gqlconfig': `
        {
          schema: {
            files: ['schema/*.gql', 'schema/*.graphql'],
          },
          query: {
            files: [
              {
                match: ['query/**/*.graphql', 'query/**/*.gql'],
              },
              {
                match: 'relay/**/*.js',
                presets: ['relay'],
              },
              {
                match: 'apollo/**/*.js',
                presets: ['apollo'],
              },
              {
                match: 'relay-modern/**/*.js',
                presets: ['relay-modern'],
              },
              {
                match: 'custom/**/*.xyz',
                parser: [
                  'embedded-queries',
                  {
                    start: '"""',
                    end: '"""',
                  }
                ],
                presets: ['default'],
              }
            ]
          }
        }
      `,
    ...getSchemaFiles(),
  });

  const gql = new GQLService({
    configDir: rootDir,
    watch: false,
  });
  gql.onError(err => {
    throw err;
  });

  await gql.start();

  const refs = sortRefs(
    gql.findRefs({
      sourcePath: path.join(rootDir, params.sourcePath),
      sourceText: params.sourceText,
      position: params.position,
    }),
  );

  const allRefs = getAllRefs(rootDir);

  await gql.stop();

  return { allRefs, refs };
}
