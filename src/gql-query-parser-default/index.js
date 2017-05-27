/* @flow */
import { type QueryParserLoadedPkg } from 'gql-config/types';
import QueryParser from './QueryParser';
import { validateOptions } from './options';

export default function parserPkg(options: mixed): QueryParserLoadedPkg {
  const parserOptions = validateOptions(options);

  return {
    create() {
      return new QueryParser(parserOptions);
    },
  };
}
