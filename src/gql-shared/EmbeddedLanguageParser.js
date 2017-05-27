/* @flow */
/* global Class */
import { type IParser, type Stream } from './types';

type RegExpStr = string;
type Options = {|
  startMatch: RegExpStr,
  endMatch: RegExpStr,
  Parser: Class<IParser>,
  parserOptions: Object,
|};

class EmbeddedLanguageParser {
  _languageParser = null; // note language parser is set only when inside

  _opts: Options;
  _startRegex: RegExp;
  _endRegex: RegExp;

  constructor(opts: Options) {
    this._opts = opts;

    this._startRegex = new RegExp(opts.startMatch);
    this._endRegex = new RegExp(`^${opts.endMatch}`);
  }

  _resetToStartState = (state: Object) => {
    // clear state [without loosing reference]
    Object.keys(state).forEach(key => {
      delete state[key];
    });

    Object.assign(state, this.startState());
  };

  startState() {
    return { rule: [] };
  }

  token(stream: Stream, state: any) {
    const { Parser, parserOptions } = this._opts;

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
      this._languageParser = new Parser(parserOptions);
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
}

export default EmbeddedLanguageParser;
export { EmbeddedLanguageParser };
