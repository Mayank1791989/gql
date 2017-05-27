/* @flow */
import { createTempFiles } from 'gql-test-utils/file';
import GQLConfig from 'gql-config';
import GQLWatcher from 'gql-watcher';

import GQLSchemaService from '../GQLSchemaService';

test('Issues: Crash: Interface', async () => {
  const dir = createTempFiles({
    '.gqlconfig': `
      {
        schema: {
          files: "schema/**/*.gql",
        }
      }
    `,
    'schema/schema.gql': `
      interface Friendly {
        bestFriend: Friendly
      }

      type Person implements Friendly {
        bestFriend: Person
      }
    `,
  });

  const schemaService = new GQLSchemaService({
    config: new GQLConfig({ configDir: dir }),
    watcher: new GQLWatcher({ watch: false }),
  });

  await schemaService.start();
});

describe('Support preset extendSchema', () => {
  const run = async (presetSchema: string) => {
    const dir = createTempFiles({
      'custom-preset': `
        function extendSchema() {
          return ${JSON.stringify(presetSchema, null, 2)};
        }

        module.exports = function customPreset() {
          return {
            extendSchema: extendSchema,
          };
        };
      `,
      '.gqlconfig': `
        {
          schema: {
            files: "schema/**/*.gql",
            presets: ['./custom-preset'],
          }
        }
      `,
      'schema/schema.gql': `
          type Query {
            id: String!
          }
        `,
    });

    const schemaService = new GQLSchemaService({
      config: new GQLConfig({ configDir: dir }),
      watcher: new GQLWatcher({ watch: false }),
    });

    const errors = [];
    schemaService.onError(err => {
      errors.push(err.message);
    });

    await schemaService.start();

    await schemaService.stop();

    return { schemaService, errors };
  };

  test('correctly extend schema if extend Schema valid', async () => {
    const { schemaService, errors } = await run(`
      directive @presetDirective on FIELD
    `);

    expect(errors).toEqual([]);

    expect(
      schemaService.getSchema().getDirective('presetDirective'),
    ).toBeDefined();
  });

  test('report errors if extendSchema failed to parse', async () => {
    const { errors } = await run(`
      directive presetDirective on FIELD
    `);

    expect(errors).toMatchSnapshot();
  });

  test('report errors if errors in extendSchema', async () => {
    const { errors } = await run(`
      extend type Query {
        id: String! # id already present in main schema
      }
    `);

    expect(errors).toMatchSnapshot();
  });
});
