/* @flow */
import { type DocumentNode } from 'graphql/language/ast';
import { type GQLSchema } from '../../shared/GQLTypes';
import createValidate from '../../shared/createValidate';
import { type GQLError } from '../../shared/GQLError';
import { type ValidateConfig } from '../../config/GQLConfig';

const _validate = createValidate({
  'gql-rules-schema': require('./rules/gql-rules-schema').default,
});

const defaultValidateConfig = {
  extends: 'gql-rules-schema',
};

export function validate(
  schema: GQLSchema,
  ast: DocumentNode,
  validateConfig?: ValidateConfig,
): Array<GQLError> {
  return _validate(
    schema,
    ast,
    validateConfig || defaultValidateConfig,
  );
}
