/* @flow */
import ParsedSchemaDocument from './ParsedSchemaDocument';
import { type SchemaConfigResolved } from 'gql-config/types';

export default class ParsedSchemaFile {
  _documents: $ReadOnlyArray<ParsedSchemaDocument>;
  _config: SchemaConfigResolved;

  constructor(
    documents: $ReadOnlyArray<ParsedSchemaDocument>,
    config: SchemaConfigResolved,
  ) {
    this._documents = documents;
    this._config = config;
  }

  isEmpty() {
    return this._documents.length === 0;
  }

  getDocuments(): $ReadOnlyArray<ParsedSchemaDocument> {
    return this._documents;
  }

  getConfig() {
    return this._config;
  }
}
