/* @flow */
import {
  LexRules,
  ParseRules,
  isIgnored,
  onlineParser,
} from 'graphql-language-service-parser';
import { type Stream, type TokenState, type IParser } from 'gql-shared/types';
import invariant from 'invariant';
import _pickBy from 'lodash/pickBy';

type InterpolationState = { interpolation: ?{ count: number, style: string } };

function Interpolation(style: string) {
  return {
    style: '', // NOTE: should be empty
    match(token) {
      return token.value === '${';
    },
    update(state: any) {
      state.interpolation = { count: 1, style }; // count is number of open curly braces
    },
  };
}

function eatInterpolation(stream, state: InterpolationState) {
  const { interpolation } = state;
  invariant(interpolation, 'missing interpolation field in state');
  stream.eatWhile(ch => {
    if (interpolation.count === 0) {
      state.interpolation = null;
      return false;
    }
    if (!ch) {
      return false;
    } // eol
    if (ch === '}') {
      interpolation.count -= 1;
    }
    if (ch === '{') {
      interpolation.count += 1;
    }
    return true;
  });
}

export type QueryParserOptions = {
  allowFragmentWithoutName?: boolean,
  allowFragmentInterpolation?: boolean,
  allowDocumentInterpolation?: boolean,
};

function omitNull<T: Object>(obj: T): T {
  return _pickBy(obj, Boolean);
}

const genOnlineParserOptions = (options: QueryParserOptions) => ({
  eatWhitespace: stream => stream.eatWhile(ch => isIgnored(ch) || ch === ';'),

  lexRules: omitNull({
    Interpolation:
      options.allowFragmentInterpolation || options.allowDocumentInterpolation
        ? /^\$\{/
        : null,

    // NOTE: Interpolation should be before LexRules
    // as Punctuation rule contain '$' which will be matched
    ...LexRules,
  }),

  parseRules: omitNull({
    ...ParseRules,

    // only query, mutation and fragment possible in Relay.QL
    Definition(token) {
      switch (token.value) {
        case 'query':
          return 'Query';
        case 'mutation':
          return 'Mutation';
        case 'subscription':
          return 'Subscription';
        case 'fragment':
          return 'FragmentDefinition';
        case '${':
          return options.allowDocumentInterpolation
            ? 'DocumentInterpolation'
            : null;
        default:
          return null;
      }
    },

    Selection(token, stream) {
      if (options.allowFragmentInterpolation && token.value === '${') {
        return 'FragmentInterpolation';
      }
      return (ParseRules.Selection: any)(token, stream);
    },

    // fragment interpolation extension
    ...(options.allowFragmentInterpolation
      ? { FragmentInterpolation: [Interpolation('js-frag')] }
      : {}),
    // documentInterpolation extension
    ...(options.allowDocumentInterpolation
      ? { DocumentInterpolation: [Interpolation('ws-2')] }
      : {}),
  }),

  editorConfig: {},
});

export default class QueryParser implements IParser {
  _parser: any;
  options: {};

  constructor(options: ?QueryParserOptions) {
    this.options = options || {};
    this._parser = onlineParser(
      genOnlineParserOptions({
        allowFragmentInterpolation: false,
        allowDocumentInterpolation: false,
        allowFragmentWithoutName: false,
        ...options,
      }),
    );
  }

  startState() {
    return this._parser.startState();
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
}
