/* @flow */
/* @babel-flow-runtime-enable */
import QueryParser from 'gql-query-parser-default';
import EmbeddedLanguageParser from 'gql-shared/EmbeddedLanguageParser';
import { type IParser } from 'gql-shared/types';

import { reify, type Type } from 'flow-runtime';

type Options = {
  start: string,
  end: string,
};

const OptionsType = (reify: Type<Options>);

function validateOptions(options) {
  try {
    OptionsType.assert(options);
  } catch (err) {
    throw new Error(
      `INVALID_PARSER_OPTIONS: Error in options passed to 'embedded-query-parser'. \n\n${
        err.message
      }`,
    );
  }
}

class EmbeddedQueryParser extends EmbeddedLanguageParser implements IParser {
  options: Options;
  constructor(options: Options) {
    validateOptions(options);
    const { start, end, ...queryParserOptions } = options;
    super({
      Parser: QueryParser,
      parserOptions: queryParserOptions,
      startMatch: start,
      endMatch: end,
    });
    this.options = options;
  }
}

export default EmbeddedQueryParser;
