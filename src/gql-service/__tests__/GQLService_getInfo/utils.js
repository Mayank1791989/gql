/* @flow */
import path from 'path';
import { getSchemaFiles, getAllInfo } from 'gql-test-utils/test-data';
import { dedentFiles } from 'gql-test-utils/dedentFiles';
import { createTempFiles } from 'gql-test-utils/file';
import { type GQLPosition } from 'gql-shared/types';
import GQLService from '../../GQLService';

export const allInfo = getAllInfo();

export async function getInfo(opts: {
  sourceText: string,
  sourcePath: string,
  position: GQLPosition,
  otherFiles?: { [name: string]: string },
  resolverConfig?: {},
}) {
  const rootDir = createTempFiles({
    '.gqlconfig': JSON.stringify({
      schema: {
        files: ['schema/*.gql', 'schema/*.graphql'],
        graphQLOptions: {
          commentDescriptions: true,
        },
        ...(opts.resolverConfig
          ? { plugins: [['resolver', opts.resolverConfig]] }
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
    [opts.sourcePath]: opts.sourceText,
    ...dedentFiles(opts.otherFiles),
  });

  const gql = new GQLService({
    configDir: rootDir,
    watch: false,
  });
  gql.onError(err => {
    throw err;
  });

  await gql.start();

  const result = gql.getInfo({
    sourcePath: path.join(rootDir, opts.sourcePath),
    sourceText: opts.sourceText,
    position: opts.position,
  });

  await gql.stop();

  return result;
}
