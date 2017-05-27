/* @flow */
import GQLService from '../../GQLService';
import { createTempFiles } from 'gql-test-utils/file';
import { getSchemaFiles, sortHints, getHints } from 'gql-test-utils/test-data';
import { type GQLPosition } from 'gql-shared/types';
import path from 'path';

export const allHints = getHints();

export async function autocomplete(options: {
  sourcePath: string,
  sourceText: string,
  position: GQLPosition,
  otherFiles?: { [path: string]: string },
  resolverConfig?: {},
}) {
  const rootDir = createTempFiles({
    '.gqlconfig': JSON.stringify({
      schema: {
        files: ['schema/*.gql', 'schema/**/*.graphql'],
        graphQLOptions: {
          commentDescriptions: true,
        },
        ...(options.resolverConfig
          ? { plugins: [['resolver', options.resolverConfig]] }
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
            match: 'relay-modern/**/*.js',
            presets: ['relay-modern'],
          },
          {
            match: 'apollo/**/*.js',
            presets: ['apollo'],
          },
        ],
      },
    }),
    ...getSchemaFiles(),
    ...options.otherFiles,
  });

  const gql = new GQLService({
    configDir: rootDir,
    watch: false,
  });
  gql.onError(err => {
    throw err;
  });

  await gql.start();
  const result = sortHints(
    gql.autocomplete({
      sourcePath: path.join(rootDir, options.sourcePath),
      sourceText: options.sourceText,
      position: options.position,
    }),
  );
  await gql.stop();
  return result;
}
