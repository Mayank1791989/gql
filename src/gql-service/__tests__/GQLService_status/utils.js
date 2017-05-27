/* @flow */
/* eslint-disable max-len */
import GQLService from '../../GQLService';
import { createTempFiles } from 'gql-test-utils/file';
import { dedentFiles } from 'gql-test-utils/dedentFiles';

export async function status(
  files: { [path: string]: string },
  params?: {
    resolverConfig: {},
  },
) {
  const rootDir = createTempFiles({
    '.gqlconfig': JSON.stringify({
      schema: {
        files: ['schema/*.gql', 'schema/*.graphql'],
        validate: {
          config: {
            NoUnusedTypeDefinition: 'off',
          },
        },
        ...(params && params.resolverConfig
          ? { plugins: [['resolver', params.resolverConfig]] }
          : {}),
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
            match: 'custom/**/*.xyz',
            parser: [
              'embedded-queries',
              {
                start: '"""',
                end: '"""',
              },
            ],
            presets: ['default'],
          },
        ],
      },
    }),
    ...dedentFiles(files),
  });

  const gql = new GQLService({
    configDir: rootDir,
    watch: false,
  });
  gql.onError(err => {
    throw err;
  });

  await gql.start();
  const errors = gql.status();
  await gql.stop();
  return errors;
}
