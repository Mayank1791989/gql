/* @flow */
import { ValidationContext, ValidationTypeInfo } from 'gql-shared/GQLValidate';
import SchemaContext from './SchemaContext';
import { type DocumentNode, type ASTVisitor } from 'graphql';

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

export type SchemaValidationRule = {
  +create: (context: SchemaValidationContext) => ASTVisitor,
};
