/* @flow */
import {
  LexRules,
  ParseRules,
  isIgnored,
  onlineParser,
} from 'graphql-language-service-parser';

class SchemaParser {
  _parser: any;

  constructor() {
    this._parser = onlineParser({
      eatWhitespace: (stream) => stream.eatWhile(isIgnored),
      lexRules: LexRules,
      parseRules: ParseRules,
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
