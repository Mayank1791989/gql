/* @flow */
/* @babel-flow-runtime-enable */
import { type ParserOptions as QueryParserOptions } from 'gql-query-parser-default/options';
import { reify, type Type } from 'flow-runtime';

// import QueryParserOptions not working with validation below some flow-runtime issue
// so duplicating here and below add a check to keep them in sync
type _QueryParserOptions = {|
  allowFragmentWithoutName?: boolean,
  allowFragmentInterpolation?: boolean,
  allowDocumentInterpolation?: boolean,
|};
// to keep QueryParserOptions sync with _QueryParserOptions defined here
// eslint-disable-next-line no-unused-vars
const test: QueryParserOptions = (reify: _QueryParserOptions);

export type ParserOptions = {|
  start: string,
  end: string,
  ..._QueryParserOptions,
|};

export function validateOptions(options: mixed): Options {
  try {
    const OptionsType = (reify: Type<ParserOptions>);
    OptionsType.assert(options);
    return (options: $FixMe);
  } catch (err) {
    throw new Error(
      `INVALID_PARSER_OPTIONS: Error in options passed to 'embedded-query-parser'. \n\n${
        err.message
      }`,
    );
  }
}
