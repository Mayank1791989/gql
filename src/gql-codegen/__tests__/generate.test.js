/* @flow */
import path from 'path';
import { createTempFiles } from 'gql-test-utils/file';
import { mkdirpSync } from 'gql-shared/fs-utils';
import generate from '../generate';
import fs from 'fs';

describe('generate', () => {
  test('schema flow', async () => {
    const [schemaFlow] = await generate({
      configOptions: {
        configDir: path.resolve(__dirname, './fixtures/sample-project/'),
      },
      targets: [{ type: 'schemaFlow' }],
    });
    expect(schemaFlow).toMatchSnapshot();
  });

  test('schem schema SDL', async () => {
    const [schemaSDL] = await generate({
      configOptions: {
        configDir: path.resolve(__dirname, './fixtures/sample-project/'),
      },
      targets: [{ type: 'schemaSDL' }],
    });
    expect(schemaSDL).toMatchSnapshot();
  });

  test('schema json', async () => {
    const [schemaJSON] = await generate({
      configOptions: {
        configDir: path.resolve(__dirname, './fixtures/sample-project/'),
      },
      targets: [{ type: 'schemaJSON' }],
    });
    expect(schemaJSON).toMatchSnapshot();
  });
});

test('generate: directly output to files', async () => {
  const dir = createTempFiles({
    '.gqlconfig': `
      {
        schema: {
          files: 'schema/*.gql'
        }
      }
    `,
    'schema/schema.gql': `
      type Query {
        player: Player
      }

      type Player {
        id: String
        name: String
      }
    `,
  });

  const generatedFilesDir = path.join(dir, 'generated');
  mkdirpSync(generatedFilesDir);

  const schemaFlowPath = path.join(generatedFilesDir, 'schema.flow');
  const schemaGQLPath = path.join(generatedFilesDir, 'schema.gql');
  const schemaJSONPath = path.join(generatedFilesDir, 'schema.json');

  await generate({
    configOptions: {
      configDir: dir,
    },
    targets: [
      { type: 'schemaFlow', outputPath: schemaFlowPath },
      { type: 'schemaSDL', outputPath: schemaGQLPath },
      { type: 'schemaJSON', outputPath: schemaJSONPath },
    ],
  });

  const schemaFlow = fs.readFileSync(schemaFlowPath, 'utf8');
  const schemaGQL = fs.readFileSync(schemaGQLPath, 'utf8');
  const schemaJSON = fs.readFileSync(schemaJSONPath, 'utf8');

  expect(schemaFlow).toMatchSnapshot();
  expect(schemaGQL).toMatchSnapshot();
  expect(schemaJSON).toMatchSnapshot();
});

test('generate: should handle graphql parse errors', async () => {
  await expect(
    generate({
      configOptions: {
        configDir: path.resolve(__dirname, './fixtures/error-sample-project/'),
      },
      targets: [{ type: 'schemaJSON' }],
    }),
  ).rejects.toMatchSnapshot();
});

test('generate: should report error for invalid type value', async () => {
  await expect(
    generate({
      configOptions: {
        configDir: path.resolve(__dirname, './fixtures/sample-project/'),
      },
      // $FlowDisableNextLine: passing wrong type intentionally
      targets: [{ type: 'schemaXJSON' }],
    }),
  ).rejects.toMatchSnapshot();
});
