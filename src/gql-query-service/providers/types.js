/* @flow */
import QueryContext from '../shared/QueryContext';
import { type GQLPosition } from 'gql-shared/types';
import { Source } from 'graphql';
import QueryTokenTypeInfe from '../shared/QueryTokenTypeInfo';
import { ParsedQueryDocument } from 'gql-shared/GQLQueryFile';

export type ProviderParams = $ReadOnly<{|
  token: $FixMe,
  typeInfo: QueryTokenTypeInfe,
  context: QueryContext,
  source: Source,
  position: GQLPosition,
|}>;

export type RulesProviderParams = {
  context: QueryContext,
  queryDocument: ParsedQueryDocument,
};
