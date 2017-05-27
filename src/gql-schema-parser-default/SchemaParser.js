/* @flow */
import {
  LexRules,
  ParseRules,
  isIgnored,
} from 'graphql-language-service-parser';
import { LanguageParser } from 'gql-shared/GQLParser';

import { type ISchemaParser } from 'gql-shared/types';

class SchemaParser extends LanguageParser implements ISchemaParser {
  options: {};

  constructor() {
    super({
      eatWhitespace: stream => stream.eatWhile(isIgnored),
      lexRules: LexRules,
      parseRules: ParseRules,
      editorConfig: {},
    });
    this.options = {};
  }
}

export default SchemaParser;
