/* @flow */
import { type GQLError } from 'gql-shared/GQLError';
import validate from 'gql-shared/validate';
import ValidationTypeInfo from 'gql-shared/ValidationTypeInfo';
import SchemaContext from './SchemaContext';
import SchemaValidationContext from './SchemaValidationContext';

import { type DocumentNode } from 'graphql';

export default function schemaValidate(
  context: SchemaContext,
  ast: DocumentNode,
): Array<GQLError> {
  const config = context.getConfig();

  const typeInfo = new ValidationTypeInfo(context);
  const validationContext = new SchemaValidationContext(context, ast, typeInfo);
  return validate(ast, config.validate, validationContext);
}
