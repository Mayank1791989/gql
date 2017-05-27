/* @flow */
import keyMap from 'graphql/jsutils/keyMap';
import keyValMap from 'graphql/jsutils/keyValMap';
import { type ObjMap } from 'graphql/jsutils/ObjMap';

import {
  valueFromAST,
  assertNullableType,
  GraphQLScalarType,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLDirective,
  introspectionTypes,
  specifiedScalarTypes,
  getDescription,
  Kind,
  type GraphQLType,
  type TypeNode,
  type NamedTypeNode,
  type TypeDefinitionNode,
  type ScalarTypeDefinitionNode,
  type ObjectTypeDefinitionNode,
  type FieldDefinitionNode,
  type InputValueDefinitionNode,
  type InterfaceTypeDefinitionNode,
  type UnionTypeDefinitionNode,
  type EnumTypeDefinitionNode,
  type InputObjectTypeDefinitionNode,
  type DirectiveDefinitionNode,
  type GraphQLNamedType,
  type GraphQLFieldConfig,
  type DirectiveLocationEnum,
  type BuildSchemaOptions,
} from 'graphql';

import { getNamedTypeNode, getDeprecationReason } from './utils';
import { isPlaceholderType } from './PlaceholderTypes';
import { type TypeDependenciesMap } from './types';

type OfType =
  | 'scalarType'
  | 'inputType'
  | 'outputType'
  | 'objectType'
  | 'interfaceType';

type TypeDefinitionsMap = ObjMap<TypeDefinitionNode>;

type TypeResolver = (
  typeRef: NamedTypeNode,
  ofType?: ?OfType,
) => GraphQLNamedType;

export default class ASTDefinitionBuilder {
  _typeDefinitionsMap: TypeDefinitionsMap;
  _options: ?BuildSchemaOptions;
  _resolveType: TypeResolver;
  _cache: ObjMap<GraphQLNamedType>;
  _typeDependenciesMap: TypeDependenciesMap;

  constructor(
    typeDefinitionsMap: TypeDefinitionsMap,
    options: ?BuildSchemaOptions,
    resolveType: TypeResolver,
    typeDependenciesMap?: TypeDependenciesMap,
  ) {
    this._typeDefinitionsMap = typeDefinitionsMap;
    this._options = options;
    this._resolveType = resolveType;
    this._typeDependenciesMap = typeDependenciesMap || {};

    // Initialize to the GraphQL built in scalars and introspection types.
    this._cache = keyMap(
      specifiedScalarTypes.concat(introspectionTypes),
      type => type.name,
    );
  }

  getTypeDependenciesMap() {
    return this._typeDependenciesMap;
  }

  buildTypes(
    nodes: $ReadOnlyArray<NamedTypeNode | TypeDefinitionNode>,
    ofType: OfType,
  ): Array<GraphQLNamedType> {
    return nodes.map(node => this.buildType(node, ofType));
  }

  buildType(
    node: NamedTypeNode | TypeDefinitionNode,
    ofType: OfType,
  ): GraphQLNamedType {
    if (node) {
      this._addTypeDependency(node.name.value, node);
    }

    const typeName = node.name.value;

    if (!this._cache[typeName]) {
      if (node.kind === Kind.NAMED_TYPE) {
        const defNode = this._typeDefinitionsMap[typeName];
        this._cache[typeName] = defNode
          ? this._makeSchemaDef(defNode)
          : this._resolveType(node, ofType);
      } else {
        this._cache[typeName] = this._makeSchemaDef(node);
      }
    }
    return this._cache[typeName];
  }

  _addTypeDependency(
    typeName: string,
    astNode: NamedTypeNode | TypeDefinitionNode,
  ) {
    if (!this._typeDependenciesMap[typeName]) {
      this._typeDependenciesMap[typeName] = [];
    }
    this._typeDependenciesMap[typeName].push(astNode);
  }

  _buildWrappedType(typeNode: TypeNode, ofType: OfType): GraphQLType {
    const typeDef = this.buildType(getNamedTypeNode(typeNode), ofType);
    return buildWrappedType(typeDef, typeNode);
  }

  buildDirective(directiveNode: DirectiveDefinitionNode): GraphQLDirective {
    return new GraphQLDirective({
      name: directiveNode.name.value,
      description: getDescription(directiveNode, this._options),
      locations: directiveNode.locations.map(
        node => ((node.value: any): DirectiveLocationEnum),
      ),
      args:
        directiveNode.arguments &&
        this._makeInputValues(directiveNode.arguments),
      astNode: directiveNode,
    });
  }

  buildField(field: FieldDefinitionNode): GraphQLFieldConfig<*, *> {
    return {
      // Note: While this could make assertions to get the correctly typed
      // value, that would throw immediately while type system validation
      // with validateSchema() will produce more actionable results.
      type: (this._buildWrappedType(field.type, 'outputType'): any),
      description: getDescription(field, this._options),
      args: field.arguments && this._makeInputValues(field.arguments),
      deprecationReason: getDeprecationReason(field),
      astNode: field,
    };
  }

  _makeSchemaDef(def: TypeDefinitionNode): GraphQLNamedType {
    switch (def.kind) {
      case Kind.OBJECT_TYPE_DEFINITION:
        return this._makeTypeDef(def);
      case Kind.INTERFACE_TYPE_DEFINITION:
        return this._makeInterfaceDef(def);
      case Kind.ENUM_TYPE_DEFINITION:
        return this._makeEnumDef(def);
      case Kind.UNION_TYPE_DEFINITION:
        return this._makeUnionDef(def);
      case Kind.SCALAR_TYPE_DEFINITION:
        return this._makeScalarDef(def);
      case Kind.INPUT_OBJECT_TYPE_DEFINITION:
        return this._makeInputObjectDef(def);
      default:
        throw new Error(`Type kind "${def.kind}" not supported.`);
    }
  }

  _makeTypeDef(def: ObjectTypeDefinitionNode) {
    const typeName = def.name.value;
    const { interfaces } = def;
    return new GraphQLObjectType({
      name: typeName,
      description: getDescription(def, this._options),
      fields: () => this._makeFieldDefMap(def),
      // Note: While this could make early assertions to get the correctly
      // typed values, that would throw immediately while type system
      // validation with validateSchema() will produce more actionable results.
      interfaces: interfaces
        ? () =>
            (this.buildTypes(interfaces, 'interfaceType').filter(
              // avoid including placeholder types else error will come to implement
              // placeholder fields
              type => !isPlaceholderType(type),
            ): any)
        : [],
      astNode: def,
    });
  }

  _makeFieldDefMap(
    def: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
  ) {
    return def.fields
      ? keyValMap(
          def.fields,
          field => field.name.value,
          field => this.buildField(field),
        )
      : {};
  }

  _makeInputValues(values: $ReadOnlyArray<InputValueDefinitionNode>) {
    return keyValMap(
      values,
      value => value.name.value,
      value => {
        // Note: While this could make assertions to get the correctly typed
        // value, that would throw immediately while type system validation
        // with validateSchema() will produce more actionable results.
        const type: any = this._buildWrappedType(value.type, 'inputType');
        return {
          type,
          description: getDescription(value, this._options),
          defaultValue: valueFromAST(value.defaultValue, type),
          astNode: value,
        };
      },
    );
  }

  _makeInterfaceDef(def: InterfaceTypeDefinitionNode) {
    return new GraphQLInterfaceType({
      name: def.name.value,
      description: getDescription(def, this._options),
      fields: () => this._makeFieldDefMap(def),
      astNode: def,
    });
  }

  _makeEnumDef(def: EnumTypeDefinitionNode) {
    return new GraphQLEnumType({
      name: def.name.value,
      description: getDescription(def, this._options),
      values: def.values
        ? keyValMap(
            def.values,
            enumValue => enumValue.name.value,
            enumValue => ({
              description: getDescription(enumValue, this._options),
              deprecationReason: getDeprecationReason(enumValue),
              astNode: enumValue,
            }),
          )
        : {},
      astNode: def,
    });
  }

  _makeUnionDef(def: UnionTypeDefinitionNode) {
    return new GraphQLUnionType({
      name: def.name.value,
      description: getDescription(def, this._options),
      // Note: While this could make assertions to get the correctly typed
      // values below, that would throw immediately while type system
      // validation with validateSchema() will produce more actionable results.
      types: def.types ? (this.buildTypes(def.types, 'objectType'): any) : [],
      astNode: def,
    });
  }

  _makeScalarDef(def: ScalarTypeDefinitionNode) {
    return new GraphQLScalarType({
      name: def.name.value,
      description: getDescription(def, this._options),
      astNode: def,
      serialize: value => value,
    });
  }

  _makeInputObjectDef(def: InputObjectTypeDefinitionNode) {
    return new GraphQLInputObjectType({
      name: def.name.value,
      description: getDescription(def, this._options),
      fields: () => (def.fields ? this._makeInputValues(def.fields) : {}),
      astNode: def,
    });
  }
}

function buildWrappedType(
  innerType: GraphQLType,
  inputTypeNode: TypeNode,
): GraphQLType {
  if (inputTypeNode.kind === Kind.LIST_TYPE) {
    return GraphQLList(buildWrappedType(innerType, inputTypeNode.type));
  }
  if (inputTypeNode.kind === Kind.NON_NULL_TYPE) {
    const wrappedType = buildWrappedType(innerType, inputTypeNode.type);
    return GraphQLNonNull(assertNullableType(wrappedType));
  }
  return innerType;
}
