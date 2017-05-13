/* @flow */
import { type DocumentNode } from 'graphql/language/ast';
import { type GQLSchema } from '../../shared/GQLTypes';
import { type ValidateConfig } from '../../config/GQLConfig';
import { type GQLError } from '../../shared/GQLError';
import createValidate from '../../shared/createValidate';
import _memoize from 'lodash/memoize';
import createRelaySchema from '../_shared/createRelaySchema';

const getDefaultValidateConfig = _memoize((isRelay) => (
  { extends: isRelay ? 'gql-rules-query-relay' : 'gql-rules-query' }
));

const _validate = createValidate({
  'gql-rules-query-relay': require('./rules/gql-rules-query-relay').default,
  'gql-rules-query': require('./rules/gql-rules-query').default,
});

export default function validate(
  schema: GQLSchema,
  ast: DocumentNode,
  options: {
    isRelay?: boolean,
    validate?: ValidateConfig,
  },
): Array<GQLError> {
  return _validate(
    options.isRelay ? createRelaySchema(schema) : schema,
    ast,
    options.validate || getDefaultValidateConfig(options.isRelay),
  );
}
