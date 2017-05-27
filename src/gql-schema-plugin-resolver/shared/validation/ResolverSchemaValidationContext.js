/* @flow */
import GQLResolvers from '../document/GQLResolvers';
import { SchemaValidationContext } from 'gql-schema-service';

export default class SchemaResolverValidationContext extends SchemaValidationContext {
  _resolvers: GQLResolvers;

  constructor(resolvers, context, ast, typeInfo) {
    super(context, ast, typeInfo);
    this._resolvers = resolvers;
  }

  getResolvers(): GQLResolvers {
    return this._resolvers;
  }
}
