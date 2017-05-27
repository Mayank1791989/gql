/* @flow */
/* eslint-disable no-nested-ternary */
import keyMap from 'graphql/jsutils/keyMap';
import objectValues from 'graphql/jsutils/objectValues';
import {
  isIntrospectionType,
  isObjectType,
  isInterfaceType,
  isUnionType,
  isListType,
  isNonNullType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLDirective,
  Kind,
  type GraphQLType,
  type GraphQLNamedType,
  type DocumentNode,
  type DirectiveDefinitionNode,
  type BuildSchemaOptions,
} from 'graphql';

import { type GQLError, newGQLError, SEVERITY } from 'gql-shared/GQLError';
import ASTDefinitionBuilder from './ASTDefinitionBuilder';
import { PLACEHOLDER_TYPES } from './PlaceholderTypes';
import invariant from 'invariant';
import GQLSchema from './GQLSchema';

/**
 * Produces a new schema given an existing schema and a document which may
 * contain GraphQL type extensions and definitions. The original schema will
 * remain unaltered.
 *
 * Because a schema represents a graph of references, a schema cannot be
 * extended without effectively making an entire copy. We do not know until it's
 * too late if subgraphs remain unchanged.
 *
 * This algorithm copies the provided schema, applying extensions while
 * producing the copy. The original schema remains unaltered.
 *
 * Accepts options as a third argument:
 *
 *    - commentDescriptions:
 *        Provide true to use preceding comments as the description.
 *
 */
export default function extendSchema(
  schema: GQLSchema,
  documentAST: DocumentNode,
  options?: BuildSchemaOptions,
): {
  schema: GQLSchema,
  extendSchemaErrors: $ReadOnlyArray<GQLError>,
  errors: $ReadOnlyArray<GQLError>,
} {
  // Collect the type definitions and extensions found in the document.
  const extendSchemaErrors: Array<GQLError> = [];
  const typeDefinitionMap = Object.create(null);
  const typeExtensionsMap = Object.create(null);

  // New directives and types are separate because a directives and types can
  // have the same name. For example, a type named "skip".
  const directiveDefinitions: Array<DirectiveDefinitionNode> = [];

  for (let i = 0; i < documentAST.definitions.length; i += 1) {
    const def = documentAST.definitions[i];
    switch (def.kind) {
      case Kind.OBJECT_TYPE_DEFINITION:
      case Kind.INTERFACE_TYPE_DEFINITION:
      case Kind.ENUM_TYPE_DEFINITION:
      case Kind.UNION_TYPE_DEFINITION:
      case Kind.SCALAR_TYPE_DEFINITION:
      case Kind.INPUT_OBJECT_TYPE_DEFINITION: {
        // Sanity check that none of the defined types conflict with the
        // schema's existing types.
        const typeName = def.name.value;
        if (schema.getType(typeName)) {
          extendSchemaErrors.push(
            newGQLError(
              `Type "${typeName}" already exists in the schema. It cannot also ` +
                'be defined in this type definition.',
              [def],
              SEVERITY.error,
            ),
          );
        } else {
          typeDefinitionMap[typeName] = def;
        }
        break;
      }
      case Kind.OBJECT_TYPE_EXTENSION:
      case Kind.INTERFACE_TYPE_EXTENSION: {
        // Sanity check that this type extension exists within the
        // schema's existing types.
        const extendedTypeName = def.name.value;
        const existingType = schema.getType(extendedTypeName);
        if (!existingType) {
          extendSchemaErrors.push(
            newGQLError(
              `Cannot extend type "${extendedTypeName}" because it does not ` +
                'exist in the existing schema.',
              [def],
              SEVERITY.error,
            ),
          );
        } else {
          const error = checkExtensionNode(existingType, def);
          if (error) {
            extendSchemaErrors.push(error);
          } else {
            const existingTypeExtensions = typeExtensionsMap[extendedTypeName];
            typeExtensionsMap[extendedTypeName] = existingTypeExtensions
              ? existingTypeExtensions.concat([def])
              : [def];
          }
        }
        break;
      }
      case Kind.DIRECTIVE_DEFINITION: {
        const directiveName = def.name.value;
        const existingDirective = schema.getDirective(directiveName);
        if (existingDirective) {
          extendSchemaErrors.push(
            newGQLError(
              `Directive "${directiveName}" already exists in the schema. It ` +
                'cannot be redefined.',
              [def],
              SEVERITY.error,
            ),
          );
        } else {
          directiveDefinitions.push(def);
        }
        break;
      }
      case Kind.SCALAR_TYPE_EXTENSION:
      case Kind.UNION_TYPE_EXTENSION:
      case Kind.ENUM_TYPE_EXTENSION:
      case Kind.INPUT_OBJECT_TYPE_EXTENSION:
      default:
        extendSchemaErrors.push(
          newGQLError(
            `The ${def.kind} kind is not yet supported by extendSchema().`,
            [def],
            SEVERITY.warn,
          ),
        );
        break;
    }
  }

  // If this document contains no new types, extensions, or directives then
  // return the same unmodified GraphQLSchema instance.
  if (
    Object.keys(typeExtensionsMap).length === 0 &&
    Object.keys(typeDefinitionMap).length === 0 &&
    directiveDefinitions.length === 0
  ) {
    return {
      schema,
      errors: [...schema._errors, ...extendSchemaErrors], // contains all errors
      extendSchemaErrors, // contain only extendSchemaErrors
    };
  }

  const astBuilder = new ASTDefinitionBuilder(
    typeDefinitionMap,
    options,
    (typeNode, ofType) => {
      const typeName = typeNode.name.value;
      const existingType = schema.getType(typeName);
      if (existingType) {
        return getExtendedType(existingType);
      }

      extendSchemaErrors.push(
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
    schema._typeDependenciesMap,
  );

  const extendTypeCache = Object.create(null);

  // Get the root Query, Mutation, and Subscription object types.
  const existingQueryType = schema.getQueryType();
  const queryType = existingQueryType
    ? getExtendedType(existingQueryType)
    : null;

  const existingMutationType = schema.getMutationType();
  const mutationType = existingMutationType
    ? getExtendedType(existingMutationType)
    : null;

  const existingSubscriptionType = schema.getSubscriptionType();
  const subscriptionType = existingSubscriptionType
    ? getExtendedType(existingSubscriptionType)
    : null;

  const types = [
    // Iterate through all types, getting the type definition for each, ensuring
    // that any type not directly referenced by a field will get created.
    ...objectValues(schema.getTypeMap()).map(type => getExtendedType(type)),
    // Do the same with new types.
    ...astBuilder.buildTypes(objectValues(typeDefinitionMap), 'objectType'),
  ];

  // Support both original legacy names and extended legacy names.
  // const schemaAllowedLegacyNames = schema.__allowedLegacyNames;
  // const extendAllowedLegacyNames = options && options.allowedLegacyNames;
  // const allowedLegacyNames =
  //   schemaAllowedLegacyNames && extendAllowedLegacyNames
  //     ? schemaAllowedLegacyNames.concat(extendAllowedLegacyNames)
  //     : schemaAllowedLegacyNames || extendAllowedLegacyNames;

  // Then produce and return a Schema with these types.
  const extendedSchema = new GQLSchema({
    query: queryType,
    mutation: mutationType,
    subscription: subscriptionType,
    types,
    directives: getMergedDirectives(),
    astNode: schema.astNode,
    assumeValid: true,
    commentDescriptions: options ? options.commentDescriptions : undefined,
    typeDependenciesMap: astBuilder.getTypeDependenciesMap(),
  });

  return {
    schema: extendedSchema,
    errors: [...extendedSchema._errors, ...extendSchemaErrors],
    extendSchemaErrors,
  };

  // Below are functions used for producing this schema that have closed over
  // this scope and have access to the schema, cache, and newly defined types.

  function getMergedDirectives(): Array<GraphQLDirective> {
    const existingDirectives = schema.getDirectives();
    // no-need
    // invariant(existingDirectives, 'schema must have default directives');
    return existingDirectives.concat(
      directiveDefinitions.map(node => astBuilder.buildDirective(node)),
    );
  }

  function getExtendedType<T: GraphQLNamedType>(type: T): T {
    if (!extendTypeCache[type.name]) {
      extendTypeCache[type.name] = extendType(type);
    }
    return (extendTypeCache[type.name]: any);
  }

  // To be called at most once per type. Only getExtendedType should call this.
  function extendType(type) {
    if (isIntrospectionType(type)) {
      // Introspection types are not extended.
      return type;
    }
    if (isObjectType(type)) {
      return extendObjectType(type);
    }
    if (isInterfaceType(type)) {
      return extendInterfaceType(type);
    }
    if (isUnionType(type)) {
      return extendUnionType(type);
    }
    // This type is not yet extendable.
    return type;
  }

  function extendObjectType(type: GraphQLObjectType): GraphQLObjectType {
    const { name } = type;
    const extensionASTNodes = typeExtensionsMap[name]
      ? type.extensionASTNodes
        ? type.extensionASTNodes.concat(typeExtensionsMap[name])
        : typeExtensionsMap[name]
      : type.extensionASTNodes;

    if (typeExtensionsMap[name]) {
      typeExtensionsMap[name].forEach(extensionNode => {
        astBuilder._addTypeDependency(extensionNode.name.value, extensionNode);
      });
    }

    return new GraphQLObjectType({
      name,
      description: type.description,
      interfaces: () => extendImplementedInterfaces(type),
      fields: () => extendFieldMap(type),
      astNode: type.astNode,
      extensionASTNodes,
      isTypeOf: type.isTypeOf,
    });
  }

  function extendInterfaceType(
    type: GraphQLInterfaceType,
  ): GraphQLInterfaceType {
    const { name } = type;
    const extensionASTNodes = typeExtensionsMap[name]
      ? type.extensionASTNodes
        ? type.extensionASTNodes.concat(typeExtensionsMap[name])
        : typeExtensionsMap[name]
      : type.extensionASTNodes;

    if (typeExtensionsMap[name]) {
      typeExtensionsMap[name].forEach(extensionNode => {
        astBuilder._addTypeDependency(extensionNode.name.value, extensionNode);
      });
    }

    return new GraphQLInterfaceType({
      name: type.name,
      description: type.description,
      fields: () => extendFieldMap(type),
      astNode: type.astNode,
      extensionASTNodes,
      resolveType: type.resolveType,
    });
  }

  function extendUnionType(type: GraphQLUnionType): GraphQLUnionType {
    return new GraphQLUnionType({
      name: type.name,
      description: type.description,
      types: type.getTypes().map(getExtendedType),
      astNode: type.astNode,
      resolveType: type.resolveType,
    });
  }

  function extendImplementedInterfaces(
    type: GraphQLObjectType,
  ): Array<GraphQLInterfaceType> {
    const interfaces = type.getInterfaces().map(getExtendedType);

    // If there are any extensions to the interfaces, apply those here.
    const extensions = typeExtensionsMap[type.name];
    if (extensions) {
      extensions.forEach(extension => {
        extension.interfaces.forEach(namedType => {
          // Note: While this could make early assertions to get the correctly
          // typed values, that would throw immediately while type system
          // validation with validateSchema() will produce more actionable results.
          interfaces.push(
            (astBuilder.buildType(namedType, 'interfaceType'): any),
          );
        });
      });
    }

    return interfaces;
  }

  function extendFieldMap(type: GraphQLObjectType | GraphQLInterfaceType) {
    const newFieldMap = Object.create(null);
    const oldFieldMap = type.getFields();
    Object.keys(oldFieldMap).forEach(fieldName => {
      const field = oldFieldMap[fieldName];
      newFieldMap[fieldName] = {
        description: field.description,
        deprecationReason: field.deprecationReason,
        type: extendFieldType(field.type),
        args: keyMap(field.args, arg => arg.name),
        astNode: field.astNode,
        resolve: field.resolve,
      };
    });

    // If there are any extensions to the fields, apply those here.
    const extensions = typeExtensionsMap[type.name];
    if (extensions) {
      extensions.forEach(extension => {
        extension.fields.forEach(field => {
          const fieldName = field.name.value;
          if (oldFieldMap[fieldName]) {
            extendSchemaErrors.push(
              newGQLError(
                `Field "${type.name}.${fieldName}" already exists in the ` +
                  'schema. It cannot also be defined in this type extension.',
                [field],
                SEVERITY.error,
              ),
            );
          } else {
            newFieldMap[fieldName] = astBuilder.buildField(field);
          }
        });
      });
    }

    return newFieldMap;
  }

  function extendFieldType<T: GraphQLType>(typeDef: T): T {
    if (isListType(typeDef)) {
      return (GraphQLList(extendFieldType(typeDef.ofType)): any);
    }
    if (isNonNullType(typeDef)) {
      return (GraphQLNonNull(extendFieldType(typeDef.ofType)): any);
    }
    return getExtendedType(typeDef);
  }
}

function checkExtensionNode(type, node): ?GQLError {
  switch (node.kind) {
    case Kind.OBJECT_TYPE_EXTENSION:
      if (!isObjectType(type)) {
        return newGQLError(
          `Cannot extend non-object type "${type.name}".`,
          [node],
          SEVERITY.error,
        );
      }
      break;
    case Kind.INTERFACE_TYPE_EXTENSION:
      if (!isInterfaceType(type)) {
        return newGQLError(
          `Cannot extend non-interface type "${type.name}".`,
          [node],
          SEVERITY.error,
        );
      }
      break;
    default:
      return null;
  }
  return null;
}
