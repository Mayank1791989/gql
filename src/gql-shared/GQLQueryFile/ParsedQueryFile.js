/* @flow */
import ParsedQueryDocument from './ParsedQueryDocument';
import { type QueryConfigResolved } from 'gql-config/types';

export default class ParsedQueryFile {
  _documents: $ReadOnlyArray<ParsedQueryDocument>;
  _config: QueryConfigResolved;

  constructor(
    documents: $ReadOnlyArray<ParsedQueryDocument>,
    config: QueryConfigResolved,
  ) {
    this._documents = documents;
    this._config = config;
  }

  isEmpty() {
    return this._documents.length === 0;
  }

  getDocuments(): $ReadOnlyArray<ParsedQueryDocument> {
    return this._documents;
  }

  getConfig() {
    return this._config;
  }
}
