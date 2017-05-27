/* @flow */
import {
  type Stream,
  type TokenState,
  type IQueryParser,
  type GQLPosition,
} from 'gql-shared/types';
import {
  LanguageParser,
  getFragmentDefinitionsAtPosition,
} from 'gql-shared/GQLParser';
import {
  genOnlineParserOptions,
  eatInterpolation,
  type InterpolationState,
} from './onlineParser';
import { type ParserOptions } from './options';
import { Source } from 'graphql';

class QueryParser extends LanguageParser implements IQueryParser {
  _opts: ParserOptions;

  constructor(options: ParserOptions) {
    super(
      genOnlineParserOptions({
        allowFragmentInterpolation: false,
        allowDocumentInterpolation: false,
        allowFragmentWithoutName: false,
        ...options,
      }),
    );
    this._opts = options;
  }

  token(stream: Stream, state: TokenState) {
    const _state: InterpolationState = (state: any);
    if (_state.interpolation) {
      const { style } = _state.interpolation;
      // NOTE: eatInterpolation mutate both stream and state
      eatInterpolation(stream, _state);
      stream._start -= 2; // to include '${' in token
      return style;
    }

    return this._parser.token(stream, state);
  }

  supportsFragmentWithoutName(): boolean {
    return this._opts.allowFragmentInterpolation || false;
  }

  getFragmentDefinitionsAtPosition(
    context: $FixMe,
    source: Source,
    position: GQLPosition,
    filterByName?: string,
  ) {
    return getFragmentDefinitionsAtPosition(
      this,
      context,
      source,
      position,
      filterByName,
    );
  }
}

export default QueryParser;
