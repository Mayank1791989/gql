/* @flow */
import { GQLSchema } from 'gql-shared/GQLSchema';
import {
  type GraphQLAbstractType,
  type NamedTypeNode,
  type TypeDefinitionNode,
} from 'graphql';
import { type DirectiveAppliedOn } from 'gql-shared/types';

export default class TypeInfoContext {
  _schema: GQLSchema;

  constructor(schema: GQLSchema) {
    this._schema = schema;
  }

  getSchema() {
    return this._schema;
  }

  getPrinter() {
    return this._schema.printer;
  }

  getQueryType() {
    return this._schema.getQueryType();
  }

  getMutationType() {
    return this._schema.getMutationType();
  }

  getSubscriptionType() {
    return this._schema.getSubscriptionType();
  }

  getType(name: string) {
    return this._schema.getType(name);
  }

  // eslint-disable-next-line no-unused-vars
  getDirective(name: string, appliedOn: ?DirectiveAppliedOn) {
    // console.log(appliedOn);
    return this._schema.getDirective(name);
  }

  // eslint-disable-next-line no-unused-vars
  getDirectives(appliedOn: ?DirectiveAppliedOn) {
    // console.log(appliedOn);
    return this._schema.getDirectives();
  }

  getTypeMap() {
    return this._schema.getTypeMap();
  }

  getPossibleTypes(abstractType: GraphQLAbstractType) {
    return this._schema.getPossibleTypes(abstractType);
  }

  getTypeDependents(
    typeName: string,
  ): $ReadOnlyArray<NamedTypeNode | TypeDefinitionNode> {
    return this._schema.getTypeDependents(typeName);
  }
}
