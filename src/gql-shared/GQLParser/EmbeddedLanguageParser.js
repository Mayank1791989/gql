/* @flow */
/* global Class */
import getTokenAtPosition from './getTokenAtPosition';
import extractDocuments from './extractDocuments';
import LanguageParser from './LanguageParser';
import { Source } from 'graphql';
import { type Stream, type GQLPosition, type Document } from '../types';

type RegExpStr = string;
type Options = {|
  startMatch: RegExpStr,
  endMatch: RegExpStr,
  Parser: { create(): LanguageParser },
|};

class EmbeddedLanguageParser {
  _languageParser: ?LanguageParser = null; // note language parser is set only when inside

  _opts: Options;
  _startRegex: RegExp;
  _endRegex: RegExp;

  constructor(opts: Options) {
    this._opts = opts;

    this._startRegex = new RegExp(opts.startMatch, 'u');
    this._endRegex = new RegExp(`^${opts.endMatch}`, 'u');
  }

  _resetToStartState = (state: Object, startState: Object) => {
    // clear state [without loosing reference]
    Object.keys(state).forEach(key => {
      delete state[key];
    });

    Object.assign(state, startState);
  };

  startState() {
    return { rule: [] };
  }

  token(stream: Stream, state: any) {
    const { Parser } = this._opts;

    // match
    if (!this._languageParser) {
      // console.log(this._startRegex);
      const match = stream._sourceText
        .substring(stream.getCurrentPosition())
        .match(this._startRegex);

      if (!match) {
        //
        stream._start = stream._pos; // exclude previous token
        stream.skipToEnd();
        return 'ws-empty';
      }

      // if match
      // push language parser
      // console.log('push', stream._sourceText.substring(stream.getCurrentPosition()));
      stream.skipTo(
        stream.getCurrentPosition() + match.index + match[0].length,
      );
      // console.log('[start] push lanaguage parser', {
      //   peek: `[${stream.peek()}]`,
      //   remaining: stream._sourceText.substring(stream.getCurrentPosition()),
      // });
      this._languageParser = Parser.create();
      Object.assign(state, this._languageParser.startState());
      return 'ws-start';
    }

    // if language parser set
    // console.log(`peek [${stream.peek()}]`);
    if (stream.match(this._endRegex)) {
      // pop language parser
      // console.log('pop');
      this._languageParser = null;
      this._resetToStartState(state, this.startState());
      return 'ws-end';
    }
    // use language parser to parse
    // $FlowIssue
    return this._languageParser.token(stream, state);
  }

  getTokenAtPosition(source: Source, position: GQLPosition) {
    return getTokenAtPosition(this, source.body, position);
  }

  getDocuments(source: Source): $ReadOnlyArray<Document> {
    return extractDocuments(source, this);
  }

  supportsFragmentWithoutName(): boolean {
    return false;
  }
}

export default EmbeddedLanguageParser;
export { EmbeddedLanguageParser };
