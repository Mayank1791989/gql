/* @flow */
import QueryValidationContext from './QueryValidationContext';
import QueryContext from './QueryContext';

import ValidationTypeInfo from 'gql-shared/ValidationTypeInfo';
import { ParsedQueryDocument } from 'gql-shared/GQLQueryFile';
import validate from 'gql-shared/validate';
import { type GQLError } from 'gql-shared/GQLError';

export default function queryValidate(
  context: QueryContext,
  parsedQueryDocument: ParsedQueryDocument,
): Array<GQLError> {
  const config = context.getConfig();

  const ValidationContext =
    config.validate.ValidationContext || QueryValidationContext;

  const typeInfo = new ValidationTypeInfo(context);

  const validationContext = new ValidationContext(
    context,
    parsedQueryDocument,
    typeInfo,
  );

  return validate(
    parsedQueryDocument.getNode(),
    config.validate,
    validationContext,
  );
}
