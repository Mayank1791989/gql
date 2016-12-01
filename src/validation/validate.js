/* @flow */
/* eslint-disable no-use-before-define */
import { visitInParallel, visit, GraphQLError } from 'graphql';
import { allRules } from './rules';
import type { DocumentNode, GQLError } from '../utils/types';
import GraphQLSchema from '../utils/GraphQLSchema';
import { toGQLError } from '../utils/GQLError';
import { SEVERITY } from '../constants';

export function validate(
  schema: GraphQLSchema,
  ast: DocumentNode,
): Array<GQLError> {
  const context = new ValidationContext(schema, ast);
  const visitors = allRules.map(rule => rule(context));
  visit(ast, visitInParallel(visitors));
  return context.getErrors();
}

// NOTE: keeping the structure of Validation context
// same as graphql-js ValidationContext so we can reuse
// graphql-js validation rule
class ValidationContext {
  _schema: GraphQLSchema;
  _ast: DocumentNode;
  _errors: Array<GQLError> = [];

  constructor(schema: GraphQLSchema, ast: DocumentNode) {
    this._schema = schema;
    this._ast = ast;
  }

  reportError(error: GraphQLError, severity: $Keys<typeof SEVERITY>) {
    this._errors.push(toGQLError(error, severity));
  }

  getErrors(): Array<GQLError> {
    return this._errors;
  }

  getSchema(): GraphQLSchema {
    return this._schema;
  }

  getDocument(): DocumentNode {
    return this._ast;
  }
}
