/* @flow */
import { type GQLConfigFile, validateConfigFile } from './types';
import fs from 'fs';
import JSON5 from 'json5';
import path from 'path';

export default function readConfigFile(filePath: string): GQLConfigFile {
  const fileData = fs.readFileSync(filePath, 'utf8');
  try {
    const configFile = JSON5.parse(fileData);
    validateConfigFile(configFile);
    return configFile;
  } catch (err) {
    const filename = path.basename(filePath);
    throw new Error(
      `GQL_CONFIG_FILE_INVALID: Error parsing '${filename}' \n\n${err.message}`,
    );
  }
}
