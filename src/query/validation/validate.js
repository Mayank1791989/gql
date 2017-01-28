/* @flow */
import { type DocumentNode } from 'graphql/language/ast';
import { type GQLSchema } from '../../shared/GQLTypes';
import {
  SEVERITY,
  toGQLError,
  type GQLError,
} from '../../shared/GQLError';

import createRelaySchema from '../_shared/createRelaySchema';
import { visitUsingRules } from 'graphql/validation/validate';
import { TypeInfo } from 'graphql/utilities/TypeInfo';

import { allRules, relayRules } from './rules';

export default function validate(
  schema: GQLSchema,
  ast: DocumentNode,
  relay: boolean,
): Array<GQLError> {
  const queryRules = relay ? relayRules : allRules;
  const _schema: any = relay ? createRelaySchema(schema) : schema; // HACK to disable flow errros
  const typeInfo = new TypeInfo(_schema);
  const errors = visitUsingRules(_schema, typeInfo, ast, queryRules);
  return errors.map(error => toGQLError(error, SEVERITY.error));
}
