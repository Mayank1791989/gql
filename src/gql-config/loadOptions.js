/* @flow */
import { type OptionsConfig, type OptionsConfigResolved } from './types';

const DefaultOptions = {
  modulePaths: ['<configDir>'],
};

export default function loadOptions(
  options: ?OptionsConfig,
  configDir: string,
): OptionsConfigResolved {
  const normalizedOptions = {
    ...DefaultOptions,
    ...options,
  };

  return {
    modulePaths: normalizedOptions.modulePaths.map(mpath => {
      return mpath.replace('<configDir>', configDir);
    }),
  };
}
