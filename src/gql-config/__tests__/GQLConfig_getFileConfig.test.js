/* @flow */
import GQLConfig from '../GQLConfig';
import path from 'path';
import { createTempFiles } from 'gql-test-utils/file';

test('getFileConfig: schema files', () => {
  // eslint-disable-next-line no-unused-vars
  const rootPath = createTempFiles({
    '.gqlconfig': `
      {
        schema: {
          files: 'schema/*.graphql'
        },
      }
    `,
  });

  const gqlConfig = new GQLConfig({
    configDir: rootPath,
  });

  const config = gqlConfig.getFileConfig(
    path.join(rootPath, 'schema/query.graphql'),
  );

  expect(config).toBeDefined();
  if (config) {
    expect(config.type).toEqual('schema');
    expect(config.opts).toBeDefined();
  }
});

test('getFileConfig: schema files', () => {
  // eslint-disable-next-line no-unused-vars
  const rootPath = createTempFiles({
    '.gqlconfig': `
      {
        schema: {
          files: 'schema/*.graphql'
        },

        query: {
          files: [
            {
              match: 'js/*.js'
            },
            {
              match: 'relay/*.js'
            }
          ],
        }
      }
    `,
  });

  const gqlConfig = new GQLConfig({
    configDir: rootPath,
  });

  // tester
  const config1 = gqlConfig.getFileConfig(
    path.join(rootPath, 'js/component.js'),
  );
  expect(config1).toBeDefined();
  if (config1) {
    expect(config1.type).toEqual('query');
    expect(config1.opts.match).toEqual('js/*.js');
  }

  // tester
  const config2 = gqlConfig.getFileConfig(
    path.join(rootPath, 'relay/component.js'),
  );
  expect(config2).toBeDefined();
  if (config2) {
    expect(config2.type).toEqual('query');
    expect(config2.opts.match).toEqual('relay/*.js');
  }
});

test('getFileConfig: unknown file', () => {
  // eslint-disable-next-line no-unused-vars
  const rootPath = createTempFiles({
    '.gqlconfig': `
      {
        schema: {
          files: 'schema/*.graphql'
        },
      }
    `,
  });

  const gqlConfig = new GQLConfig({
    configDir: rootPath,
  });

  const config = gqlConfig.getFileConfig(
    path.join(rootPath, 'xschema/xquery.graphql'),
  );

  expect(config).toBeFalsy();
});
