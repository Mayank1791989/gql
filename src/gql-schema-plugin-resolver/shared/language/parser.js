/* @flow strict */
import { Source } from 'graphql';
import { type GQLPosition } from 'gql-shared/types';
import { type ResolverDocumentNode } from './ast';
import { type ResolverToken } from './token';

export interface IResolverParser {
  parse(source: Source): ResolverDocumentNode;
  getTokenAtPosition(
    source: Source,
    position: GQLPosition,
  ): ResolverToken | null;
}
