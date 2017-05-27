/* @flow */
import ParsedResolverDocument from './ParsedResolverDocument';
import { type GQLError } from 'gql-shared/GQLError';
import { type ResolverDocumentNode, type ResolverNode } from '../language/ast';

type ParsedFilesMap = Map<string, ParsedResolverDocument>;

export default class GQLResolvers {
  _parsedFilesMap: ParsedFilesMap = new Map();
  _validationErrors: $ReadOnlyArray<GQLError> = [];

  //  @TODO: cache result
  getMergedNode(): ResolverDocumentNode {
    const mergedNode = {
      kind: 'ResolverDocument',
      resolvers: [],
    };

    this.forEachParsedDocument(doc => {
      if (!doc.getParseError()) {
        mergedNode.resolvers.push(...doc.getResolvers());
      }
    });

    return mergedNode;
  }

  setMergedNodeValidationErrors(errors: $ReadOnlyArray<GQLError>) {
    this._validationErrors = errors;
  }

  getMergedNodeValidationErrors(): $ReadOnlyArray<GQLError> {
    return this._validationErrors;
  }

  forEachParsedDocument(fn: (file: ParsedResolverDocument) => void) {
    this._parsedFilesMap.forEach(fn);
  }

  add(absPath: string, parsedFile: ParsedResolverDocument) {
    this._parsedFilesMap.set(absPath, parsedFile);
  }

  remove(absPath: string) {
    this._parsedFilesMap.delete(absPath);
  }

  find(name: string, item: string | null): $ReadOnlyArray<ResolverNode> {
    const resolvers = [];
    this._parsedFilesMap.forEach(file => {
      resolvers.push(...file.findResolvers(name, item));
    });
    return resolvers;
  }
}
