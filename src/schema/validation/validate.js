/* @flow */
/* eslint-disable no-use-before-define */
import { visitInParallel, visit, GraphQLError } from 'graphql';
import { type DocumentNode } from 'graphql/language/ast';
import schemaRules from './rules';

import { type GQLSchema } from '../../shared/GQLTypes';

import {
  type GQLError,
  SEVERITY,
  toGQLError,
} from '../../shared/GQLError';

export function validate(
  schema: GQLSchema,
  ast: DocumentNode,
): Array<GQLError> {
  const context = new ValidationContext(schema, ast);
  const visitors = schemaRules.map(rule => rule(context));
  visit(ast, visitInParallel(visitors));
  return context.getErrors();
}

// NOTE: keeping the structure of Validation context
// same as graphql-js ValidationContext so we can reuse
// graphql-js validation rule
class ValidationContext {
  _schema: GQLSchema;
  _ast: DocumentNode;
  _errors: Array<GQLError> = [];

  constructor(schema: GQLSchema, ast: DocumentNode) {
    this._schema = schema;
    this._ast = ast;
  }

  reportError(error: GraphQLError, severity: $Keys<typeof SEVERITY>) {
    this._errors.push(toGQLError(error, severity));
  }

  getErrors(): Array<GQLError> {
    return this._errors;
  }

  getSchema(): GQLSchema {
    return this._schema;
  }

  getDocument(): DocumentNode {
    return this._ast;
  }
}
