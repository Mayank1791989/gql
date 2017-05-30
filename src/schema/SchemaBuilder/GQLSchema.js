/* @flow */
/**
 *  Note this is modified version of original GQLSchema
 *  1) Return Array<Errors> instead of throwing on first error.
 */

import {
  // eslint-disable-line no-duplicate-imports
  type GraphQLAbstractType,
  GraphQLNonNull,
  GraphQLObjectType,
} from 'graphql/type/definition';

import { type TypeDefinitionNode, type ASTNode } from 'graphql/language/ast';

import { specifiedDirectives } from 'graphql/type/directives';
import find from 'graphql/jsutils/find';
import invariant from 'graphql/jsutils/invariant';
import { isEqualType, isTypeSubTypeOf } from 'graphql/utilities/typeComparators';
import { type GQLError, SEVERITY, newGQLError } from '../../shared/GQLError';
import { PLACEHOLDER_TYPES } from './PlaceholderTypes';
import getNamedTypeNode from './getNamedTypeNode';

import {
  GQLDirective,
  GQLUnionType,
  GQLInterfaceType,
  GQLObjectType,
  type GQLNamedType,
  type GQLSchema,
} from '../../shared/GQLTypes';

type GQLSchemaConfig = {
  query: ?GQLObjectType,
  mutation?: ?GQLObjectType,
  subscription?: ?GQLObjectType,
  types?: ?Array<GQLNamedType>,
  directives?: ?Array<GQLDirective>,
  nodeMap: { [name: string]: TypeDefinitionNode },
};

export default class _GQLSchema {
  _queryType: ?GQLObjectType;
  _mutationType: ?GQLObjectType;
  _subscriptionType: ?GQLObjectType;
  _directives: Array<GQLDirective>;
  _typeMap: { [typeName: string]: GQLNamedType } = {};
  _implementations: { [interfaceName: string]: Array<GQLObjectType> };
  _possibleTypeMap: ?{
    [abstractName: string]: { [possibleName: string]: boolean },
  };

  _nodeMap: { [name: string]: TypeDefinitionNode };
  _errors: Array<GQLError> = [];

  constructor(config: GQLSchemaConfig) {
    this._queryType = config.query;
    this._mutationType = config.mutation;
    this._subscriptionType = config.subscription;
    this._directives = config.directives || specifiedDirectives;
    this._implementations = {};
    this._nodeMap = config.nodeMap;

    // Build type map now to detect any errors within this schema.
    const types: Array<GQLNamedType> = config.types || [];

    // create typeMap and implementations map
    types.forEach((type) => {
      if (type) {
        this._typeMap[type.name] = type;
      }
      // // NOTE: dont remove type.getFields()
      // // calling to resolve thunks which will add more errors
      // // also wrapping in try catch to suppress errors thrown inside getFields function
      // // errors thrown by getFields is already handle while creating schema from AST
      if (type.getFields) {
        try {
          // $FlowDisableNextLine
          type.getFields(); // resolve thunk
        } catch (e) {} // eslint-disable-line no-empty
      }

      if (type instanceof GQLObjectType) {
        const _type = type;
        type.getInterfaces().forEach((iface) => {
          const impls = this._implementations[iface.name];
          if (impls) {
            impls.push(_type);
          } else {
            this._implementations[iface.name] = [_type];
          }
        });
      }
    });

    // validate GQLObjectType correctly implements interfaces
    Object.keys(this._typeMap).forEach((typeName) => {
      const type = this._typeMap[typeName];
      if (type instanceof GQLObjectType) {
        type.getInterfaces().forEach((iface) => {
          this._errors.push(
            // eslint-disable-next-line no-use-before-define
            ...assertObjectImplementsInterface((this: any), type, iface),
          );
        });
      }
    });
  }

  getQueryType(): ?GQLObjectType {
    return this._queryType;
  }

  getMutationType(): ?GQLObjectType {
    return this._mutationType;
  }

  getSubscriptionType(): ?GQLObjectType {
    return this._subscriptionType;
  }

  getTypeMap() {
    return this._typeMap;
  }

  getType(name: string): ?GQLNamedType {
    return this.getTypeMap()[name];
  }

  getTypeNode(name: string): ?TypeDefinitionNode {
    return this._nodeMap[name];
  }

  getTypeDependents(name: string): Array<ASTNode> {
    const type = this.getType(name);
    if (type) {
      return type.dependents || [];
    }
    return [];
  }

  getPossibleTypes(abstractType: any): Array<GQLObjectType> {
    if (abstractType instanceof GQLUnionType) {
      return abstractType.getTypes();
    }
    invariant(abstractType instanceof GQLInterfaceType);
    return (this._implementations[abstractType.name]: any);
  }

  isPossibleType(abstractType: GraphQLAbstractType, possibleType: GraphQLObjectType): boolean {
    let possibleTypeMap = this._possibleTypeMap;
    if (!possibleTypeMap) {
      possibleTypeMap = Object.create(null);
      this._possibleTypeMap = possibleTypeMap;
    }

    if (!possibleTypeMap[abstractType.name]) {
      const possibleTypes = this.getPossibleTypes(abstractType);
      invariant(
        Array.isArray(possibleTypes),
        `Could not find possible implementing types for ${abstractType.name} ` +
          'in schema. Check that schema.types is defined and is an array of ' +
          'all possible types in the schema.',
      );
      possibleTypeMap[abstractType.name] = possibleTypes.reduce(
        (map, type) => ((map[type.name] = true), map), // eslint-disable-line
        Object.create(null),
      );
    }

    return Boolean(possibleTypeMap[abstractType.name][possibleType.name]);
  }

  getDirectives(): Array<GQLDirective> {
    return this._directives;
  }

  getDirective(name: string): ?GQLDirective {
    return find(this.getDirectives(), (directive) => directive.name === name);
  }
}

function assertObjectImplementsInterface(
  schema: GQLSchema,
  object: GQLObjectType,
  iface: GQLInterfaceType,
): Array<GQLError> {
  if (iface === PLACEHOLDER_TYPES.interfaceType) {
    return [];
  }

  const objectFieldMap = object.getFields();

  const ifaceFieldMap = iface.getFields();

  const missingFields = [];
  const errors = [];

  // Assert each interface field is implemented.
  Object.keys(ifaceFieldMap).forEach((fieldName) => {
    const objectField = objectFieldMap[fieldName];
    const ifaceField = ifaceFieldMap[fieldName];

    if (!objectField) {
      missingFields.push(ifaceField);
      return;
    }

    // Assert interface field type is satisfied by object field type, by being
    // a valid subtype. (covariant)
    if (!isTypeSubTypeOf((schema: any), (objectField.type: any), (ifaceField.type: any))) {
      errors.push(
        newGQLError(
          `${iface.name}.${fieldName} expects type "${String(ifaceField.type)}" ` +
            'but ' +
            `${object.name}.${fieldName} provides type "${String(objectField.type)}".`,
          [getNamedTypeNode(objectField.node.type)],
          SEVERITY.error,
        ),
      );
    }

    // Assert each interface field arg is implemented.
    ifaceField.args.forEach((ifaceArg) => {
      const argName = ifaceArg.name;
      const objectArg = find(objectField.args, (arg) => arg.name === argName);

      // Assert interface field arg exists on object field.
      if (!objectArg) {
        errors.push(
          newGQLError(
            `${iface.name}.${fieldName} expects argument "${argName}" but ` +
              `${object.name}.${fieldName} does not provide it.`,
            [objectField.node],
            SEVERITY.error,
          ),
        );
        return;
      }

      // Assert interface field arg type matches object field arg type.
      // (invariant)
      if (!isEqualType((ifaceArg.type: any), (objectArg.type: any))) {
        errors.push(
          newGQLError(
            `${iface.name}.${fieldName}(${argName}:) expects type ` +
              `"${String(ifaceArg.type)}" but ` +
              `${object.name}.${fieldName}(${argName}:) provides type ` +
              `"${String(objectArg.type)}".`,
            [getNamedTypeNode(objectArg.node.type)],
            SEVERITY.error,
          ),
        );
      }
    });

    // Assert additional arguments must not be required.
    objectField.args.forEach((objectArg) => {
      const argName = objectArg.name;
      const ifaceArg = find(ifaceField.args, (arg) => arg.name === argName);
      if (!ifaceArg && objectArg.type instanceof GraphQLNonNull) {
        errors.push(
          newGQLError(
            `${object.name}.${fieldName}(${argName}:) is of required type ` +
              `"${String(objectArg.type)}" but is not also provided by the ` +
              `interface ${iface.name}.${fieldName}.`,
            [objectArg.node],
            SEVERITY.error,
          ),
        );
      }
    });
  });

  if (missingFields.length > 0) {
    errors.push(
      newGQLError(
        `Missing interface fields [${missingFields.map((field) => field.name).join(', ')}]`,
        [object.node],
        SEVERITY.error,
      ),
    );
  }

  return errors;
}
