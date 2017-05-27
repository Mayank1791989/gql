/* @flow */
import { Source } from 'graphql';
import { type ResolverDocumentNode, type ResolverNode } from '../language/ast';
import { type GQLError } from 'gql-shared/GQLError';
import invariant from 'invariant';

export default class ParsedResolverDocument {
  _ast: ?ResolverDocumentNode;
  _parseError: ?GQLError;
  _source: Source;

  _validationErrors: $ReadOnlyArray<GQLError> = [];

  constructor(
    ast: ?ResolverDocumentNode,
    parseError: ?GQLError,
    source: Source,
  ) {
    this._ast = ast;
    this._parseError = parseError;
    this._source = source;
  }

  getParseError(): ?GQLError {
    return this._parseError;
  }

  getNode(): ResolverDocumentNode {
    invariant(this._ast, 'expecting ast to be present here');
    return this._ast;
  }

  getResolvers(): $ReadOnlyArray<ResolverNode> {
    return this.getNode().resolvers;
  }

  getFilePath(): string {
    return this._source.name;
  }

  getValidationErrors(): $ReadOnlyArray<GQLError> {
    return this._validationErrors;
  }

  getErrors(): $ReadOnlyArray<GQLError> {
    if (this._parseError) {
      return [this._parseError];
    }
    return this._validationErrors;
  }

  setValidationErrors(errors: $ReadOnlyArray<GQLError>) {
    this._validationErrors = errors;
  }

  // @TODO: optimize this query by creating some lookup table
  findResolvers(
    typeName: string,
    fieldName: string | null,
  ): $ReadOnlyArray<ResolverNode> {
    if (!this._ast) {
      return [];
    }

    return this._ast.resolvers.filter(node => {
      const fields = getSearchFields(node);
      return fields.typeName === typeName && fields.fieldName === fieldName;
    });
  }
}

function getSearchFields(
  node: ResolverNode,
): { typeName: string, fieldName: null | string } {
  switch (node.kind) {
    case 'TypeResolver':
    case 'ObjectTypeResolver':
    case 'ResolveTypeResolver':
    case 'ScalarTypeResolver':
    case 'EnumTypeResolver':
    case 'DirectiveResolver':
      return {
        typeName: node.name.value,
        fieldName: null,
      };
    case 'FieldResolver':
    case 'ObjectFieldResolver':
    case 'EnumValueResolver':
      return {
        typeName: node.type.value,
        fieldName: node.name.value,
      };
    default:
      return invariant(false, 'invalid node type');
  }
}
