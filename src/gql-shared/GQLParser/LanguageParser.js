/* @flow */
import { Source } from 'graphql';
import { type GQLPosition, type IParser, type Document } from '../types';
import { onlineParser } from 'graphql-language-service-parser';

import getTokenAtPosition from './getTokenAtPosition';
import extractDocuments from './extractDocuments';

type ParserOptions = $FixMe;

export default class LanguageParser implements IParser {
  _parser: IParser;

  constructor(options: ParserOptions) {
    this._parser = onlineParser(options);
  }

  startState() {
    return this._parser.startState();
  }

  token(stream: any, state: any): string {
    return this._parser.token(stream, state);
  }

  supportsFragmentWithoutName(): boolean {
    return false;
  }

  getTokenAtPosition(source: Source, position: GQLPosition) {
    return getTokenAtPosition(this, source.body, position);
  }

  getDocuments(source: Source): $ReadOnlyArray<Document> {
    return extractDocuments(source, this);
  }
}
