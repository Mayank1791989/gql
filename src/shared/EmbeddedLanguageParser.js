/* @flow */
/* global Class */
import {
  type IParser,
  type Stream,
} from './types';

type RegExpStr = string;
type Options = $Exact<{
  startMatch: RegExpStr,
  endMatch: RegExpStr,
  Parser: Class<IParser>,
}>;

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
    Object.keys(state).forEach((key) => {
      delete state[key];
    });

    Object.assign(state, this.startState());
  };

  startState = () => ({ rule: [] });

  token(stream: Stream, state: any) {
    const { Parser } = this._opts;

    // match
    if (!this._languageParser) {
      // console.log(this._startRegex);
      const match = (
        stream._sourceText
        .substring(stream.getCurrentPosition())
        .match(this._startRegex)
      );
      if (!match) { //
        stream._start = stream._pos; // exclude previous token
        stream.skipToEnd();
        return 'ws-2';
      }

      if (match) { // push language parser
        // console.log('push', stream._sourceText.substring(stream.getCurrentPosition()));
        stream.skipTo(stream.getCurrentPosition() + match.index + match[0].length);
        // console.log('[start] push lanaguage parser', {
        //   peek: `[${stream.peek()}]`,
        //   remaining: stream._sourceText.substring(stream.getCurrentPosition()),
        // });
        this._languageParser = new Parser();
        Object.assign(state, this._languageParser.startState());
        return 'ws-2';
      }
    }

    // if language parser set
    if (this._languageParser) {
      // console.log(`peek [${stream.peek()}]`);
      if (stream.match(this._endRegex)) { // pop language parser
        // console.log('pop');
        this._languageParser = null;
        this._resetToStartState(state, this.startState());
        return 'ws-2';
      }
      // use language parser to parse
      // $FlowIssue
      return this._languageParser.token(stream, state);
    }

    return null;
  }
}

export default EmbeddedLanguageParser;
export { EmbeddedLanguageParser };
