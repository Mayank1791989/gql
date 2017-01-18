/* @flow */
import { LexRules, ParseRules, isIgnored } from 'codemirror-graphql/utils/Rules';
import onlineParser from 'codemirror-graphql/utils/onlineParser';

class SchemaParser {
  _parser: any;

  constructor() {
    this._parser = onlineParser({
      eatWhitespace: stream => stream.eatWhile(isIgnored),
      LexRules,
      ParseRules,
    });
  }

  startState() {
    return this._parser.startState();
  }

  token(stream: any, state: any) {
    return this._parser.token(stream, state);
  }
}

export default SchemaParser;
