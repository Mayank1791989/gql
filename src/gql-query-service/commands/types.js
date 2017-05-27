/* @flow */
import QueryContext from '../shared/QueryContext';
import { type GQLPosition } from 'gql-shared/types';
import { Source } from 'graphql';

export type CommandParams = $ReadOnly<{|
  context: QueryContext,
  source: Source,
  position: GQLPosition,
|}>;
