/* @flow */
import { type DocumentNode, Source, type DefinitionNode } from 'graphql';
import { type SchemaConfigResolved } from 'gql-config/types';
import { type GQLError } from 'gql-shared/GQLError';
import invariant from 'invariant';

export default class ParsedSchemaDocument {
  _ast: ?DocumentNode;
  _parseError: ?GQLError;
  _config: SchemaConfigResolved;
  _source: Source;
  _match: { start: string, end: string };

  constructor(
    ast: ?DocumentNode,
    parseError: ?GQLError,
    source: Source,
    config: SchemaConfigResolved,
    match: { start: string, end: string },
  ) {
    this._ast = ast;
    this._parseError = parseError;
    this._source = source;
    this._config = config;
    this._match = match;
  }

  getParseError(): ?GQLError {
    return this._parseError;
  }

  getNode(): DocumentNode {
    invariant(this._ast, 'expecting ast to be present here');
    return this._ast;
  }

  getDefinitions(): $ReadOnlyArray<DefinitionNode> {
    return this.getNode().definitions;
  }

  getConfig() {
    return this._config;
  }

  getFilePath(): string {
    return this._source.name;
  }
}
