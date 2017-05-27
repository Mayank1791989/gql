/* @flow */
import { type GQLPosition } from 'gql-shared/types';
import { Source } from 'graphql';
import SchemaContext from '../shared/SchemaContext';

export type ProviderParams = {|
  token: $FixMe,
  context: SchemaContext,
  source: Source,
  position: GQLPosition,
|};

export type RulesProviderParams = {|
  context: SchemaContext,
|};
