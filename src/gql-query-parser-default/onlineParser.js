/* @flow */
import {
  LexRules,
  ParseRules,
  isIgnored,
  onlineParser,
} from 'graphql-language-service-parser';
import { type Stream } from 'gql-shared/types';
import invariant from 'invariant';
import _pickBy from 'lodash/pickBy';
import { type ParserOptions } from './options';

export { onlineParser };

export type InterpolationState = {
  interpolation: ?{ count: number, style: string },
};

export function eatInterpolation(stream: Stream, state: InterpolationState) {
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

export const genOnlineParserOptions = (options: ParserOptions) => ({
  eatWhitespace: (stream: $FixMe) => {
    return stream.eatWhile(ch => isIgnored(ch) || ch === ';');
  },

  lexRules: omitNull({
    Interpolation:
      options.allowFragmentInterpolation || options.allowDocumentInterpolation
        ? /^\$\{/u
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

function omitNull<T: Object>(obj: T): T {
  return _pickBy(obj, Boolean);
}

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