/* @flow */
/* @babel-flow-runtime-enable */
import { reify, type Type } from 'flow-runtime';

export type ParserOptions = {|
  allowFragmentWithoutName?: boolean,
  allowFragmentInterpolation?: boolean,
  allowDocumentInterpolation?: boolean,
|};

export function validateOptions(options: mixed): ParserOptions {
  try {
    const OptionsType = (reify: Type<ParserOptions>);
    OptionsType.assert(options);
    return (options: $FixMe);
  } catch (err) {
    throw new Error(
      `INVALID_PARSER_OPTIONS: Error in options passed to 'query-parser'. \n\n${
        err.message
      }`,
    );
  }
}
