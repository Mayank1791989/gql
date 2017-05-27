/* @flow */
import {
  LexRules,
  ParseRules,
  isIgnored,
  onlineParser,
} from 'graphql-language-service-parser';

import { type IParser } from 'gql-shared/types';

class SchemaParser implements IParser {
  _parser: any;
  options: *;

  constructor() {
    this.options = {};
    this._parser = onlineParser({
      eatWhitespace: stream => stream.eatWhile(isIgnored),
      lexRules: LexRules,
      parseRules: ParseRules,
      editorConfig: {},
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
