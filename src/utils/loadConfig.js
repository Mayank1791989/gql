/* @flow */
import findConfig from 'find-config';
import JSON5 from 'json5';
import fs from 'fs';
import Ajv from 'ajv';
import type { GQLConfig } from './types';

type Options = $Exact<{
  cwd?: string
}>;

const CONFIG_FILE_NAME = '.gqlconfig';

function validateConfig(config) {
  const ajv = new Ajv();
  const isValid = ajv.validate({
    type: 'object',
    required: ['schema'],
    properties: {
      schema: {
        required: ['files'],
        type: 'object',
        properties: {
          files: { type: 'string' },
        },
      },
    },
  }, config);

  if (!isValid) {
    throw new Error(`
      .gqlconfig is not valid.
      ${ajv.errorsText()}
    `);
  }
}

function readConfig(configFilePath: string): GQLConfig {
  const fileData = fs.readFileSync(configFilePath, { encoding: 'utf8' });
  try {
    const config = JSON5.parse(fileData);
    validateConfig(config);
    return config;
  } catch (err) {
    throw new Error(`Error parsing ${CONFIG_FILE_NAME}. \n ${err.message}`);
  }
}

export default function loadConfig(options: ?Options): GQLConfig {
  const result = findConfig.obj(CONFIG_FILE_NAME, options);
  if (!result) { // config exists
    // throw error .gqlConfig not found
    throw new Error(`Could not find a ${CONFIG_FILE_NAME} file. Create a ${CONFIG_FILE_NAME} file in project root directory.`);
  }

  const config = readConfig(result.path);
  config.path = result.path;
  config.dir = result.dir;

  return config;
}
