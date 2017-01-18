/* @flow */
/* global Class */
import type { IParser, Stream } from './types';

type RegExpStr = string;
type Options = $Exact<{
  startMatch: RegExpStr,
  endMatch: RegExpStr,
  Parser: Class<IParser>,
}>;

class EmbeddedLanguageParser {
  _languageParser = null; // note language parser is set only when inside

  _opts: Options;

  constructor(opts: Options) {
    this._opts = opts;
  }

  _resetToStartState = (state: Object) => {
    // clear state [without loosing reference]
    Object.keys(state).forEach((key) => {
      delete state[key];
    });

    Object.assign(state, this.startState());
  };

  startState = () => ({});

  token(stream: Stream, state: any) {
    const { startMatch, endMatch, Parser } = this._opts;

    // match
    if (!this._languageParser) {
      const match = stream._sourceText.slice(stream._pos).match(startMatch);
      // console.log(startMatch, match);
      if (!match) { //
        stream.skipToEnd();
        return 'ws-2';
      }

      if (match) {
        stream.skipTo(match.index + match[0].length);
        this._languageParser = new Parser();
        Object.assign(state, this._languageParser.startState());
        return 'ws-2';
      }
    }

    // if language parser set
    if (this._languageParser) {
      if (stream.match(endMatch)) { // check endMatch
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
