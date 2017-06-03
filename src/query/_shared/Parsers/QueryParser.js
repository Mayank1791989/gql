/* @flow */
import {
  LexRules,
  ParseRules,
  isIgnored,
  onlineParser,
} from 'graphql-language-service-parser';
import { type Stream, type TokenState } from '../../../shared/types';
import invariant from 'invariant';

type InterpolationState = { count: number, style: string };

function Interpolation(style: string) {
  return {
    style: '', // NOTE: should be empty
    match(token) {
      return token.value === '${';
    },
    update(state) {
      state.interpolation = { count: 1, style }; // count is number of open curly braces
    },
  };
}

function eatInterpolation(stream, state) {
  const { interpolation } = state;
  invariant(interpolation, 'missing interpolation field in state');
  stream.eatWhile((ch) => {
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

const parserOptions = {
  eatWhitespace: (stream) => stream.eatWhile((ch) => isIgnored(ch) || ch === ';'),
  lexRules: {
    JSInlineFragment: /^\$\{/,
    ...LexRules,
  },

  parseRules: {
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
          return 'DocumentInterpolation';
        default:
          return null;
      }
    },

    Selection(token, stream) {
      if (token.value === '${') {
        return 'JSInlineFragment';
      }
      return ParseRules.Selection(token, stream);
    },

    JSInlineFragment: [Interpolation('js-frag')],
    DocumentInterpolation: [Interpolation('ws-2')],
  },
};

export default class QueryParser {
  _parser: any;

  constructor() {
    this._parser = onlineParser(parserOptions);
  }

  startState() {
    return this._parser.startState();
  }

  token(stream: Stream, state: TokenState & { interpolation: ?InterpolationState }) {
    if (state.interpolation) {
      const { style } = state.interpolation;
      // NOTE: eatInterpolation mutate both stream and state
      eatInterpolation(stream, state);
      stream._start -= 2; // to include '${' in token
      return style;
    }

    return this._parser.token(stream, state);
  }
}
