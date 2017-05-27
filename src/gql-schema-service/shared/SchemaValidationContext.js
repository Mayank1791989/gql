/* @flow */
import ValidationContext from 'gql-shared/ValidationContext';
import SchemaContext from './SchemaContext';
import { type DocumentNode } from 'graphql';
import ValidationTypeInfo from 'gql-shared/ValidationTypeInfo';

export default class SchemaValidationContext extends ValidationContext {
  _context: SchemaContext;

  constructor(
    context: SchemaContext,
    ast: DocumentNode,
    typeInfo: ValidationTypeInfo,
  ) {
    super(context.getSchema(), ast, typeInfo);
    this._context = context;
  }
}
