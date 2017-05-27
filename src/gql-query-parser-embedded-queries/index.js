/* @flow */
import { type QueryParserLoadedPkg } from 'gql-config/types';
import EmbeddedQueryParser from './EmbeddedQueryParser';
import { validateOptions } from './options';

export default function parserPkg(options: mixed): QueryParserLoadedPkg {
  const parserOptions = validateOptions(options);

  return {
    create() {
      return new EmbeddedQueryParser(parserOptions);
    },
  };
}
