/* @flow */
/* eslint-disable no-use-before-define */
/**
 * NOTE: patched version
 */
import find from 'graphql/jsutils/find';
import invariant from 'graphql/jsutils/invariant';
import keyValMap from 'graphql/jsutils/keyValMap';
import { valueFromAST } from 'graphql/utilities/valueFromAST';
import { TokenKind } from 'graphql/language/lexer';
import { getArgumentValues } from 'graphql/execution/values';

import {
  LIST_TYPE,
  NON_NULL_TYPE,
  SCHEMA_DEFINITION,
  SCALAR_TYPE_DEFINITION,
  OBJECT_TYPE_DEFINITION,
  INTERFACE_TYPE_DEFINITION,
  ENUM_TYPE_DEFINITION,
  UNION_TYPE_DEFINITION,
  INPUT_OBJECT_TYPE_DEFINITION,
  DIRECTIVE_DEFINITION,
} from 'graphql/language/kinds';

import {
  type Location,
  type ASTNode,
  type DocumentNode,
  type DirectiveNode,
  type TypeNode,
  type SchemaDefinitionNode,
  type TypeDefinitionNode,
  type ScalarTypeDefinitionNode,
  type ObjectTypeDefinitionNode,
  type InputValueDefinitionNode,
  type InterfaceTypeDefinitionNode,
  type UnionTypeDefinitionNode,
  type EnumTypeDefinitionNode,
  type InputObjectTypeDefinitionNode,
  type DirectiveDefinitionNode,
} from 'graphql/language/ast';

import GQLSchema from './GQLSchema';
import getNamedTypeNode from './getNamedTypeNode';

import {
  GQLSkipDirective,
  type GQLType,
  GQLDirective,
  GQLInterfaceType,
  GQLUnionType,
  GQLEnumType,
  GQLObjectType,
  GQLScalarType,
  GQLID,
  type GQLNamedType,
  GQLInputObjectType,
  GQLInt,
  GQLBoolean,
  GQLIncludeDirective,
  GQLFloat,
  GQLString,
  GQLDeprecatedDirective,
} from '../../shared/GQLTypes';

import {
  type GraphQLOutputType,
  type GraphQLInputType,
  // eslint-disable-line no-duplicate-imports
  type GraphQLType,
  isOutputType,
  isInputType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInterfaceType,
  GraphQLObjectType,
} from 'graphql/type/definition';

import {
  // eslint-disable-line no-duplicate-imports
  type DirectiveLocationEnum,
} from 'graphql/type/directives';

// import {
//   __Schema,
//   __Directive,
//   __DirectiveLocation,
//   __Type,
//   __Field,
//   __InputValue,
//   __EnumValue,
//   __TypeKind,
// } from 'graphql/type/introspection';

import { type GQLError, SEVERITY, newGQLError } from '../../shared/GQLError';

import { PLACEHOLDER_TYPES } from './PlaceholderTypes';

function buildWrappedType(
  innerType: GraphQLType,
  inputTypeAST: TypeNode,
): GQLType {
  if (inputTypeAST.kind === LIST_TYPE) {
    return new GraphQLList(
      (buildWrappedType(innerType, inputTypeAST.type): any),
    );
  }
  if (inputTypeAST.kind === NON_NULL_TYPE) {
    const wrappedType = buildWrappedType(innerType, inputTypeAST.type);
    invariant(!(wrappedType instanceof GraphQLNonNull), 'No nesting nonnull.');
    return new GraphQLNonNull((wrappedType: any));
  }
  return (innerType: any);
}

export function buildASTSchema( // eslint-disable-line complexity
  ast: DocumentNode,
): { schema: GQLSchema, errors: Array<GQLError> } {
  let schemaDef: ?SchemaDefinitionNode = null;
  const errors: Array<GQLError> = [];
  const typeDefs: Array<TypeDefinitionNode> = [];
  const nodeMap: { [name: string]: TypeDefinitionNode } = Object.create(null);
  const nodeMapWithAllReferences: {
    [name: string]: Array<TypeDefinitionNode>,
  } = Object.create(null);
  const directiveDefs: Array<DirectiveDefinitionNode> = [];

  for (let i = 0; i < ast.definitions.length; i += 1) {
    const d = ast.definitions[i];
    switch (d.kind) {
      case SCHEMA_DEFINITION:
        if (schemaDef) {
          errors.push(
            newGQLError(
              'Must provide only one schema definition.',
              [schemaDef, d],
              SEVERITY.error,
            ),
          );
        }
        schemaDef = d;
        break;
      case SCALAR_TYPE_DEFINITION:
      case OBJECT_TYPE_DEFINITION:
      case INTERFACE_TYPE_DEFINITION:
      case ENUM_TYPE_DEFINITION:
      case UNION_TYPE_DEFINITION:
      case INPUT_OBJECT_TYPE_DEFINITION: {
        const name = d.name.value;
        if (!nodeMap[name]) {
          typeDefs.push(d);
          nodeMap[name] = d;
        }
        //  storing all reference to detect multiple defintition with same name
        if (!nodeMapWithAllReferences[name]) {
          nodeMapWithAllReferences[name] = [];
        }
        nodeMapWithAllReferences[name].push(d);
        break;
      }
      case DIRECTIVE_DEFINITION:
        directiveDefs.push(d);
        break;
      default:
    }
  }

  // error for multi same name typeDef
  Object.keys(nodeMapWithAllReferences).forEach((name) => {
    if (nodeMapWithAllReferences[name].length > 1) {
      errors.push(
        newGQLError(
          `Schema must contain unique named types but contains multiple types named "${name}".`,
          nodeMapWithAllReferences[name].map((typeDefAST) => typeDefAST.name),
          SEVERITY.error,
        ),
      );
    }
  });

  let queryTypeName = null;
  let mutationTypeName = null;
  let subscriptionTypeName = null;

  if (schemaDef) {
    schemaDef.operationTypes.forEach((operationType) => {
      const typeName = operationType.type.name.value;
      if (operationType.operation === 'query') {
        queryTypeName = typeName;
      } else if (operationType.operation === 'mutation') {
        mutationTypeName = typeName;
      } else if (operationType.operation === 'subscription') {
        subscriptionTypeName = typeName;
      }
    });
  } else {
    if (nodeMap.Query) {
      queryTypeName = 'Query';
    }
    if (nodeMap.Mutation) {
      mutationTypeName = 'Mutation';
    }
    if (nodeMap.Subscription) {
      subscriptionTypeName = 'Subscription';
    }
  }

  if (!queryTypeName) {
    errors.push(
      newGQLError(
        'Must provide schema definition with query type or a type named Query.',
        null,
        SEVERITY.error,
      ),
    );
  }

  const innerTypeMap = {
    String: GQLString,
    Int: GQLInt,
    Float: GQLFloat,
    Boolean: GQLBoolean,
    ID: GQLID,
  };

  const types = typeDefs
    .map((def) => typeDefNamed(def.name.value, def))
    .filter(Boolean);

  // Adding default types
  types.push(
    innerTypeMap.String,
    innerTypeMap.Int,
    innerTypeMap.Float,
    innerTypeMap.Boolean,
    innerTypeMap.ID,
  );

  // directives
  const directives = directiveDefs.map(getDirective);

  // If specified directives were not explicitly declared, add them.
  if (!directives.some((directive) => directive.name === 'skip')) {
    directives.push(GQLSkipDirective);
  }

  if (!directives.some((directive) => directive.name === 'include')) {
    directives.push(GQLIncludeDirective);
  }

  if (!directives.some((directive) => directive.name === 'deprecated')) {
    directives.push(GQLDeprecatedDirective);
  }

  const schema = new GQLSchema({
    query: queryTypeName ? getObjectType(nodeMap[queryTypeName]) : null,
    mutation: mutationTypeName
      ? getObjectType(nodeMap[mutationTypeName])
      : null,
    subscription: subscriptionTypeName
      ? getObjectType(nodeMap[subscriptionTypeName])
      : null,
    types,
    directives,
    nodeMap,
  });

  return { schema, errors: [...errors, ...schema._errors] };

  function getDirective(directiveNode: DirectiveDefinitionNode): GQLDirective {
    return new GQLDirective(directiveNode, {
      name: directiveNode.name.value,
      description: getDescription(directiveNode),
      locations: directiveNode.locations.map(
        (node) => ((node.value: any): DirectiveLocationEnum),
      ),
      args: directiveNode.arguments && makeInputValues(directiveNode.arguments),
    });
  }

  function getObjectType(typeNode: TypeDefinitionNode): ?GQLObjectType {
    const type = typeDefNamed(typeNode.name.value, typeNode);

    if (!(type instanceof GraphQLObjectType)) {
      errors.push(
        newGQLError(
          'AST must provide object type.',
          [typeNode],
          SEVERITY.error,
        ),
      );
    }

    return (type: any);
  }

  function typeDefNamed(typeName: string, node: ASTNode): ?GQLNamedType {
    if (innerTypeMap[typeName]) {
      if (innerTypeMap[typeName].dependents) {
        innerTypeMap[typeName].dependents.push(node);
      }
      return innerTypeMap[typeName];
    }

    if (!nodeMap[typeName]) {
      // NOT found
      errors.push(
        newGQLError(`Type "${typeName}" not found.`, [node], SEVERITY.error),
      );
      return null;
    }

    const innerTypeDef = makeSchemaDef(nodeMap[typeName]);
    innerTypeDef.node = nodeMap[typeName]; // add location info
    innerTypeMap[typeName] = innerTypeDef;
    return innerTypeDef;
  }

  // function isProducedAlready(typeNode: TypeNode) {
  //   return Boolean(innerTypeMap[getNamedTypeNode(typeNode).name.value]);
  // }

  function produceType(
    typeNode: TypeNode,
    defaultValue: (name: string) => GraphQLType,
  ): GQLType {
    const namedTypeNode = getNamedTypeNode(typeNode);
    const typeName = namedTypeNode.name.value;
    const typeDef =
      typeDefNamed(typeName, namedTypeNode) || defaultValue(typeName);
    return buildWrappedType(typeDef, typeNode);
  }

  function produceInputType(typeNode: TypeNode): GraphQLInputType {
    const type = produceType(typeNode, PLACEHOLDER_TYPES.inputType);
    if (!isInputType((type: any))) {
      errors.push(
        newGQLError(
          'Expected Input type.',
          [getNamedTypeNode(typeNode)],
          SEVERITY.error,
        ),
      );
    }
    return (type: any);
  }

  function produceOutputType(typeNode: TypeNode): GraphQLOutputType {
    const type = produceType(typeNode, PLACEHOLDER_TYPES.outputType);
    if (!isOutputType((type: any))) {
      errors.push(
        newGQLError(
          'Expected Output type.',
          [getNamedTypeNode(typeNode)],
          SEVERITY.error,
        ),
      );
    }
    return (type: any);
  }

  function produceObjectType(typeNode: TypeNode): GQLObjectType {
    const type = produceType(typeNode, PLACEHOLDER_TYPES.objectType);
    if (!(type instanceof GraphQLObjectType)) {
      errors.push(
        newGQLError(
          'Expected Object type.',
          [getNamedTypeNode(typeNode)],
          SEVERITY.error,
        ),
      );
    }
    return (type: any);
  }

  function produceInterfaceType(typeNode: TypeNode): GQLInterfaceType {
    const type = produceType(typeNode, PLACEHOLDER_TYPES.interfaceType);
    if (!(type instanceof GraphQLInterfaceType)) {
      errors.push(
        newGQLError(
          'Expected Interface type.',
          [getNamedTypeNode(typeNode)],
          SEVERITY.error,
        ),
      );
    }
    return (type: any);
  }

  function makeSchemaDef(def) {
    if (!def) {
      throw new Error('def must be defined');
    }
    switch (def.kind) {
      case OBJECT_TYPE_DEFINITION:
        return makeTypeDef(def);
      case INTERFACE_TYPE_DEFINITION:
        return makeInterfaceDef(def);
      case ENUM_TYPE_DEFINITION:
        return makeEnumDef(def);
      case UNION_TYPE_DEFINITION:
        return makeUnionDef(def);
      case SCALAR_TYPE_DEFINITION:
        return makeScalarDef(def);
      case INPUT_OBJECT_TYPE_DEFINITION:
        return makeInputObjectDef(def);
      default:
        throw new Error(`Type kind "${def.kind}" not supported.`);
    }
  }

  function makeTypeDef(def: ObjectTypeDefinitionNode) {
    const typeName = def.name.value;
    return new GQLObjectType(def, {
      name: typeName,
      description: getDescription(def),
      fields: () => makeFieldDefMap(def),
      interfaces: () => makeImplementedInterfaces(def),
    });
  }

  function makeFieldDefMap(
    def: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
  ) {
    return keyValMap(
      def.fields,
      (field) => field.name.value,
      (field) => ({
        type: produceOutputType(field.type),
        node: field,
        description: getDescription(field),
        args: makeInputValues(field.arguments),
        deprecationReason: getDeprecationReason(field.directives),
      }),
    );
  }

  function makeImplementedInterfaces(def: ObjectTypeDefinitionNode) {
    return (
      def.interfaces && def.interfaces.map((iface) => produceInterfaceType(iface))
    );
  }

  function makeInputValues(values: Array<InputValueDefinitionNode>) {
    return keyValMap(
      values,
      (value) => value.name.value,
      (value) => {
        const type = produceInputType(value.type);
        return {
          type,
          node: value,
          description: getDescription(value),
          defaultValue: valueFromAST(value.defaultValue, type),
        };
      },
    );
  }

  function makeInterfaceDef(def: InterfaceTypeDefinitionNode) {
    const typeName = def.name.value;
    return new GQLInterfaceType(def, {
      name: typeName,
      description: getDescription(def),
      fields: () => makeFieldDefMap(def),
      resolveType: cannotExecuteSchema,
    });
  }

  function makeEnumDef(def: EnumTypeDefinitionNode) {
    const enumType = new GQLEnumType(def, {
      name: def.name.value,
      description: getDescription(def),
      values: keyValMap(
        def.values,
        (enumValue) => enumValue.name.value,
        (enumValue) => ({
          description: getDescription(enumValue),
          deprecationReason: getDeprecationReason(enumValue.directives),
          node: enumValue,
        }),
      ),
    });

    return enumType;
  }

  function makeUnionDef(def: UnionTypeDefinitionNode) {
    return new GQLUnionType(def, {
      name: def.name.value,
      description: getDescription(def),
      types: def.types.map((t) => produceObjectType(t)),
      resolveType: cannotExecuteSchema,
    });
  }

  function makeScalarDef(def: ScalarTypeDefinitionNode) {
    return new GQLScalarType(def, {
      name: def.name.value,
      description: getDescription(def),
      serialize: () => null,
      // Note: validation calls the parse functions to determine if a
      // literal value is correct. Returning null would cause use of custom
      // scalars to always fail validation. Returning false causes them to
      // always pass validation.
      parseValue: () => false,
      parseLiteral: () => false,
    });
  }

  function makeInputObjectDef(def: InputObjectTypeDefinitionNode) {
    return new GQLInputObjectType(def, {
      name: def.name.value,
      description: getDescription(def),
      fields: () => makeInputValues(def.fields),
    });
  }
}

function getDeprecationReason(directives: ?Array<DirectiveNode>): ?string {
  const deprecatedAST =
    directives &&
    find(
      directives,
      (directive) => directive.name.value === GQLDeprecatedDirective.name,
    );
  if (!deprecatedAST) {
    return null;
  }
  const { reason } = getArgumentValues(GQLDeprecatedDirective, deprecatedAST);
  return (reason: any);
}

/**
 * Given an ast node, returns its string description based on a contiguous
 * block full-line of comments preceding it.
 */
export function getDescription(node: { loc?: Location }): ?string {
  const { loc } = node;
  if (!loc) {
    return null;
  }
  const comments = [];
  let minSpaces = null;
  let token = loc.startToken.prev;
  while (
    token &&
    token.kind === TokenKind.COMMENT &&
    token.next &&
    token.prev &&
    token.line + 1 === token.next.line &&
    token.line !== token.prev.line
  ) {
    const value = String(token.value);
    const spaces = leadingSpaces(value);
    if (minSpaces === null || spaces < minSpaces) {
      minSpaces = spaces;
    }
    comments.push(value);
    token = token.prev;
  }
  return (
    comments
      .reverse()
      .map((comment) => comment.slice(minSpaces))
      .join('\n')
  );
}

// Count the number of spaces on the starting side of a string.
function leadingSpaces(str) {
  let i = 0;
  for (; i < str.length; i += 1) {
    if (str[i] !== ' ') {
      break;
    }
  }
  return i;
}

function cannotExecuteSchema() {
  throw new Error(
    'Generated Schema cannot use Interface or Union types for execution.',
  );
}
