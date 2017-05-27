/* @flow */
import path from 'path';
import { getSchemaFiles, getDefLocations } from 'gql-test-utils/test-data';
import { createTempFiles } from 'gql-test-utils/file';
import { dedentFiles } from 'gql-test-utils/dedentFiles';
import { type GQLPosition } from 'gql-shared/types';
import GQLService from '../../GQLService';

export async function getDef(opts: {
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

  const def = gql.getDef({
    sourcePath: path.join(rootDir, opts.sourcePath),
    sourceText: opts.sourceText,
    position: opts.position,
  });

  const defLocations = getDefLocations(rootDir);

  await gql.stop();

  return { defLocations, def };
}
