/* @flow */
import findConfig from 'find-config';

const CONFIG_FILE_NAME = '.gqlconfig';

export default function findConfigFile(
  cwd: string,
): { path: string, dir: string } {
  const result = findConfig.obj(CONFIG_FILE_NAME, { cwd });
  if (!result) {
    // throw error .gqlConfig not found
    throw new Error(
      `Could not find a '${CONFIG_FILE_NAME}' file. Make sure '${CONFIG_FILE_NAME}' file exists in project root directory.`,
    );
  }
  return result;
}
