/* @flow */
import {
  GraphQLSchema,
  validateSchema,
  GraphQLObjectType,
  type GraphQLNamedType,
  GraphQLDirective,
  type SchemaDefinitionNode,
  type NamedTypeNode,
  type TypeDefinitionNode,
} from 'graphql';
import { type GQLError, toGQLError, SEVERITY } from 'gql-shared/GQLError';
import GQLPrinter from 'gql-shared/GQLPrinter';
import { type TypeDependenciesMap } from './types';

type GQLSchemaConfig = {
  query?: ?GraphQLObjectType,
  mutation?: ?GraphQLObjectType,
  subscription?: ?GraphQLObjectType,
  types?: ?Array<GraphQLNamedType>,
  directives?: ?Array<GraphQLDirective>,
  astNode?: ?SchemaDefinitionNode,
  typeDependenciesMap: TypeDependenciesMap,
  commentDescriptions?: ?boolean,
  assumeValid?: boolean,
};

export default class GQLSchema extends GraphQLSchema {
  _errors: $ReadOnlyArray<GQLError> = [];
  _typeDependenciesMap: TypeDependenciesMap;
  printer: GQLPrinter = new GQLPrinter({});

  constructor({ commentDescriptions, ...config }: GQLSchemaConfig) {
    super({ ...config, assumeValid: false });
    this.printer = new GQLPrinter({
      commentDescriptions: Boolean(commentDescriptions),
    });
    this._typeDependenciesMap = config.typeDependenciesMap;

    if (!config.assumeValid) {
      this._errors = validateSchema(this).map(err =>
        toGQLError(err, SEVERITY.error),
      );
    }
  }

  getTypeDependents(
    typeName: string,
  ): Array<NamedTypeNode | TypeDefinitionNode> {
    return this._typeDependenciesMap[typeName] || [];
  }
}
