/* @flow */
import {
  LexRules,
  ParseRules,
  isIgnored,
  onlineParser,
} from 'graphql-language-service-parser';
import { type Stream, type TokenState } from '../../../shared/types';
import invariant from 'invariant';

function JSInlineFragment() {
  return {
    style: '',
    match(token) {
      return token.value === '${';
    },
    update(state) {
      state.jsInlineFragment = { count: 1 }; // count is number of open curly braces
    },
  };
}

function eatJSInlineFragment(stream, state) {
  const { jsInlineFragment: frag } = state;
  invariant(frag, 'missing JSInlineFragment');
  stream.eatWhile((ch) => {
    if (frag.count === 0) {
      state.jsInlineFragment = null;
      return false;
    }
    if (!ch) {
      return false;
    } // eol
    if (ch === '}') {
      frag.count -= 1;
    }
    if (ch === '{') {
      frag.count += 1;
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

    // relay only one definition per Relay.QL
    // Document: ['Definition'],

    // only query, mutation and fragment possible in Relay.QL
    Definition(token) {
      switch (token.value) {
        case 'query':
          return 'Query';
        case 'mutation':
          return 'Mutation';
        case 'fragment':
          return 'FragmentDefinition';
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

    JSInlineFragment: [JSInlineFragment()],
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

  token(stream: Stream, state: TokenState) {
    if (state.jsInlineFragment) {
      eatJSInlineFragment(stream, state);
      stream._start -= 2; // to include '${' in token
      return 'js-frag';
    }

    return this._parser.token(stream, state);
  }
}
