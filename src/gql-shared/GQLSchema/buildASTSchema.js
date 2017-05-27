/* @flow */
/* eslint-disable no-use-before-define */
/**
 * NOTE: patched version
 */
import { type ObjMap } from 'graphql/jsutils/ObjMap';
import {
  type DocumentNode,
  type SchemaDefinitionNode,
  type TypeDefinitionNode,
  type DirectiveDefinitionNode,
  GraphQLSkipDirective,
  GraphQLIncludeDirective,
  GraphQLDeprecatedDirective,
  Kind,
  specifiedScalarTypes,
  type BuildSchemaOptions,
} from 'graphql';

import ASTDefinitionBuilder from './ASTDefinitionBuilder';
import extendSchema from './extendSchema';

import GQLSchema from './GQLSchema';
import { type GQLError, SEVERITY, newGQLError } from 'gql-shared/GQLError';
import invariant from 'invariant';

import { PLACEHOLDER_TYPES } from './PlaceholderTypes';

export default function buildASTSchema( // eslint-disable-line complexity
  ast: DocumentNode,
  options?: BuildSchemaOptions,
): { schema: GQLSchema, errors: Array<GQLError> } {
  if (!ast || ast.kind !== Kind.DOCUMENT) {
    throw new Error('Must provide a document ast.');
  }

  let schemaDef: ?SchemaDefinitionNode = null;
  const errors: Array<GQLError> = [];
  const typeDefs: Array<TypeDefinitionNode> = [];
  const nodeMap: ObjMap<TypeDefinitionNode> = Object.create(null);
  const directiveDefs: Array<DirectiveDefinitionNode> = [];
  const extendSchemaAST = {
    kind: 'Document',
    definitions: [],
  };

  for (let i = 0; i < ast.definitions.length; i += 1) {
    const def = ast.definitions[i];
    switch (def.kind) {
      case Kind.SCHEMA_DEFINITION:
        if (schemaDef) {
          errors.push(
            newGQLError(
              'Must provide only one schema definition.',
              [schemaDef, def],
              SEVERITY.error,
            ),
          );
        }
        schemaDef = def;
        break;
      case Kind.SCALAR_TYPE_DEFINITION:
      case Kind.OBJECT_TYPE_DEFINITION:
      case Kind.INTERFACE_TYPE_DEFINITION:
      case Kind.ENUM_TYPE_DEFINITION:
      case Kind.UNION_TYPE_DEFINITION:
      case Kind.INPUT_OBJECT_TYPE_DEFINITION: {
        const typeName = def.name.value;
        if (nodeMap[typeName]) {
          errors.push(
            newGQLError(
              `Type "${typeName} was defined more than once."`,
              [def],
              SEVERITY.error,
            ),
          );
        } else {
          typeDefs.push(def);
          nodeMap[typeName] = def;
        }
        break;
      }
      case Kind.DIRECTIVE_DEFINITION: {
        const directiveName = def.name.value;
        if (directiveDefs.find(dir => dir.name.value === directiveName)) {
          errors.push(
            newGQLError(
              `Directive "${directiveName}" already exists in the schema. It ` +
                'cannot be redefined.',
              [def],
              SEVERITY.error,
            ),
          );
        } else {
          directiveDefs.push(def);
        }
        break;
      }
      // Type extension
      case Kind.OBJECT_TYPE_EXTENSION:
      case Kind.SCALAR_TYPE_EXTENSION:
      case Kind.INTERFACE_TYPE_EXTENSION:
      case Kind.UNION_TYPE_EXTENSION:
      case Kind.ENUM_TYPE_EXTENSION:
      case Kind.INPUT_OBJECT_TYPE_EXTENSION: {
        extendSchemaAST.definitions.push(def);
        break;
      }
      default:
        // for some future added types
        errors.push(
          newGQLError(
            `The ${def.kind} kind is not yet supported.`,
            [def],
            SEVERITY.warn,
          ),
        );
        break;
    }
  }

  const operationTypes = schemaDef
    ? getOperationTypes(schemaDef)
    : {
        query: nodeMap.Query,
        mutation: nodeMap.Mutation,
        subscription: nodeMap.Subscription,
      };

  const definitionBuilder = new ASTDefinitionBuilder(
    nodeMap,
    options,
    (typeNode, ofType) => {
      const typeName = typeNode.name.value;
      errors.push(
        newGQLError(
          `Type "${typeName}" not found.`,
          [typeNode],
          SEVERITY.error,
        ),
      );

      switch (ofType) {
        case 'scalarType':
          return PLACEHOLDER_TYPES.scalarType(typeName, (typeNode: any));
        case 'inputType':
          return PLACEHOLDER_TYPES.inputType(typeName, (typeNode: any));
        case 'outputType':
          return PLACEHOLDER_TYPES.outputType(typeName, (typeNode: any));
        case 'objectType':
          return PLACEHOLDER_TYPES.objectType(typeName, (typeNode: any));
        case 'interfaceType':
          return PLACEHOLDER_TYPES.interfaceType(typeName, (typeNode: any));
        default:
          return invariant(false, 'unhandled case');
      }
    },
  );

  // types build
  const types = definitionBuilder.buildTypes(typeDefs, 'scalarType');

  // add core types
  types.push(...specifiedScalarTypes);

  // directives
  const directives = directiveDefs.map(def =>
    definitionBuilder.buildDirective(def),
  );

  if (!directives.some(directive => directive.name === 'skip')) {
    directives.push(GraphQLSkipDirective);
  }

  if (!directives.some(directive => directive.name === 'include')) {
    directives.push(GraphQLIncludeDirective);
  }

  if (!directives.some(directive => directive.name === 'deprecated')) {
    directives.push(GraphQLDeprecatedDirective);
  }

  const isExtendSchemaRequired = extendSchemaAST.definitions.length > 0;

  // Note: While this could make early assertions to get the correctly
  // typed values below, that would throw immediately while type system
  // validation with validateSchema() will produce more actionable results.
  const schema = new GQLSchema({
    query: operationTypes.query
      ? (definitionBuilder.buildType(operationTypes.query, 'outputType'): any)
      : null,
    mutation: operationTypes.mutation
      ? (definitionBuilder.buildType(
          operationTypes.mutation,
          'outputType',
        ): any)
      : null,
    subscription: operationTypes.subscription
      ? (definitionBuilder.buildType(
          operationTypes.subscription,
          'outputType',
        ): any)
      : null,
    types,
    directives,
    astNode: schemaDef,
    assumeValid: isExtendSchemaRequired, // if we are extending schema then do validation later
    commentDescriptions: options ? options.commentDescriptions : undefined,
    typeDependenciesMap: definitionBuilder.getTypeDependenciesMap(),
  });

  if (!isExtendSchemaRequired) {
    return { schema, errors: [...errors, ...schema._errors] };
  }

  // if extension present in ast then extendSchema
  const result = extendSchema(schema, extendSchemaAST, options);
  return {
    schema: result.schema,
    errors: [...errors, ...result.errors],
  };

  function getOperationTypes(schemaDefNode: SchemaDefinitionNode) {
    const opTypes = {};
    schemaDefNode.operationTypes.forEach(operationType => {
      const typeName = operationType.type.name.value;
      const { operation } = operationType;
      if (opTypes[operation]) {
        errors.push(
          newGQLError(
            `Must provide only one ${operation} type.`,
            [operationType],
            SEVERITY.error,
          ),
        );
        return;
      }

      if (!nodeMap[typeName]) {
        errors.push(
          newGQLError(
            `Specified ${operation} type "${typeName}" not found.`,
            [operationType.type],
            SEVERITY.error,
          ),
        );
        return;
      }

      opTypes[operation] = operationType.type;
    });
    return opTypes;
  }
}
