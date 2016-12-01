/* @flow */
/**
 *  Note this is modified version of original GraphqlSchema
 *  1) Return Array<Errors> instead of throwing on first error.
 */

import {
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLNonNull,
} from 'graphql/type/definition';

import type { // eslint-disable-line no-duplicate-imports
  GraphQLNamedType,
  GraphQLAbstractType,
} from 'graphql/type/definition';

import type {
  TypeDefinitionNode,
} from 'graphql/language/ast';

import { GraphQLDirective, specifiedDirectives } from 'graphql/type/directives';
import find from 'graphql/jsutils/find';
import invariant from 'graphql/jsutils/invariant';
import { isEqualType, isTypeSubTypeOf } from 'graphql/utilities/typeComparators';
import { newGQLError } from './GQLError';
import type { GQLError } from './types';
import { SEVERITY, PLACEHOLDER_TYPES } from '../constants';
import getNamedTypeNode from './getNamedTypeNode';

type TypeMap = { [typeName: string]: GraphQLNamedType };

type GraphQLSchemaConfig = {
  query: ?GraphQLObjectType;
  mutation?: ?GraphQLObjectType;
  subscription?: ?GraphQLObjectType;
  types?: ?Array<GraphQLNamedType>;
  directives?: ?Array<GraphQLDirective>;
  nodeMap: { [name: string]: TypeDefinitionNode };
};

export default class GraphQLSchema {
  _queryType: ?GraphQLObjectType;
  _mutationType: ?GraphQLObjectType;
  _subscriptionType: ?GraphQLObjectType;
  _directives: Array<GraphQLDirective>;
  _typeMap: TypeMap = {};
  _implementations: { [interfaceName: string]: Array<GraphQLObjectType> };
  _possibleTypeMap: ?{
    [abstractName: string]: { [possibleName: string]: boolean }
  };

  _nodeMap: { [name: string]: TypeDefinitionNode };
  _errors: Array<GQLError> = [];

  constructor(config: GraphQLSchemaConfig) {
    this._queryType = config.query;
    this._mutationType = config.mutation;
    this._subscriptionType = config.subscription;
    this._directives = config.directives || specifiedDirectives;
    this._implementations = {};
    this._nodeMap = config.nodeMap;

    // Build type map now to detect any errors within this schema.
    const types: Array<GraphQLNamedType> = config.types || [];

    // create typeMap and implementations map
    types.forEach((type) => {
      if (type) { this._typeMap[type.name] = type; }
      // NOTE: dont remove type.getFields()
      // calling to resolve thunks which will add more errors
      // also wrapping in try catch to suppress errors thrown inside getFields function
      // errors thrown by getFields is already handle while creating schema from AST
      if (type.getFields) {
        try {
          // $FlowDisableNextLine
          type.getFields(); // resolve thunk
        } catch (e) { } // eslint-disable-line no-empty
      }

      if (type instanceof GraphQLObjectType) {
        const _type: GraphQLObjectType = type; // HACK for flow to work
        type.getInterfaces().forEach((iface) => {
          this._errors.push(
            // eslint-disable-next-line no-use-before-define
            ...assertObjectImplementsInterface(this, _type, iface),
          );
          const impls = this._implementations[iface.name];
          if (impls) {
            impls.push(_type);
          } else {
            this._implementations[iface.name] = [_type];
          }
        });
      }
    });
  }

  getQueryType(): ?GraphQLObjectType {
    return this._queryType;
  }

  getMutationType(): ?GraphQLObjectType {
    return this._mutationType;
  }

  getSubscriptionType(): ?GraphQLObjectType {
    return this._subscriptionType;
  }

  getTypeMap(): TypeMap {
    return this._typeMap;
  }

  getType(name: string): ?GraphQLNamedType {
    return this.getTypeMap()[name];
  }

  getTypeNode(name: string): ?TypeDefinitionNode {
    return this._nodeMap[name];
  }

  getPossibleTypes(
    abstractType: GraphQLAbstractType,
  ): Array<GraphQLObjectType> {
    if (abstractType instanceof GraphQLUnionType) {
      return abstractType.getTypes();
    }
    invariant(abstractType instanceof GraphQLInterfaceType);
    return this._implementations[abstractType.name];
  }

  isPossibleType(
    abstractType: GraphQLAbstractType,
    possibleType: GraphQLObjectType,
  ): boolean {
    let possibleTypeMap = this._possibleTypeMap;
    if (!possibleTypeMap) {
      this._possibleTypeMap = possibleTypeMap = Object.create(null);
    }

    if (!possibleTypeMap[abstractType.name]) {
      const possibleTypes = this.getPossibleTypes(abstractType);
      invariant(
        Array.isArray(possibleTypes),
        `Could not find possible implementing types for ${abstractType.name} ` +
        'in schema. Check that schema.types is defined and is an array of ' +
        'all possible types in the schema.',
      );
      possibleTypeMap[abstractType.name] =
        possibleTypes.reduce(
          (map, type) => ((map[type.name] = true), map), // eslint-disable-line
          Object.create(null),
        );
    }

    return Boolean(possibleTypeMap[abstractType.name][possibleType.name]);
  }

  getDirectives(): Array<GraphQLDirective> {
    return this._directives;
  }

  getDirective(name: string): ?GraphQLDirective {
    return find(this.getDirectives(), directive => directive.name === name);
  }
}

function assertObjectImplementsInterface(
  schema: GraphQLSchema,
  object: GraphQLObjectType,
  iface: GraphQLInterfaceType,
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
    // $FlowDisableNextLine (overriding GraphQLSchema which flow dont understand)
    if (!isTypeSubTypeOf(schema, objectField.type, ifaceField.type)) {
      errors.push(newGQLError(
        `${iface.name}.${fieldName} expects type "${String(ifaceField.type)}" ` +
        'but ' +
        `${object.name}.${fieldName} provides type "${String(objectField.type)}".`,
        // $FlowDisableNextLine (node is dynamic property added)
        [getNamedTypeNode(objectField.node.type)],
        SEVERITY.error,
      ));
    }

    // Assert each interface field arg is implemented.
    ifaceField.args.forEach((ifaceArg) => {
      const argName = ifaceArg.name;
      const objectArg = find(objectField.args, arg => arg.name === argName);

      // Assert interface field arg exists on object field.
      if (!objectArg) {
        errors.push(newGQLError(
          `${iface.name}.${fieldName} expects argument "${argName}" but ` +
          `${object.name}.${fieldName} does not provide it.`,
        // $FlowDisableNextLine (node is dynamic property added)
          [objectField.node],
          SEVERITY.error,
        ));
        return;
      }

      // Assert interface field arg type matches object field arg type.
      // (invariant)
      if (!isEqualType(ifaceArg.type, objectArg.type)) {
        // graphql remove extra 'node'' field from args so reading arguments from field
        // $FlowDisableNextLine (node is dynamic property added)
        const objectArgAST = find(objectField.node.arguments, argAST => (
          argAST.name.value === argName
        ));
        errors.push(newGQLError(
          `${iface.name}.${fieldName}(${argName}:) expects type ` +
          `"${String(ifaceArg.type)}" but ` +
          `${object.name}.${fieldName}(${argName}:) provides type ` +
          `"${String(objectArg.type)}".`,
        // $FlowDisableNextLine (node is dynamic property added)
          [getNamedTypeNode(objectArgAST.type)],
          SEVERITY.error,
        ));
      }
    });

    // Assert additional arguments must not be required.
    objectField.args.forEach((objectArg) => {
      const argName = objectArg.name;
      const ifaceArg = find(ifaceField.args, arg => arg.name === argName);
      if (!ifaceArg && objectArg.type instanceof GraphQLNonNull) {
        // $FlowDisableNextLine (node is dynamic property added)
        const objectArgAST = find(objectField.node.arguments, argAST => (
          argAST.name.value === argName
        ));
        errors.push(newGQLError(
          `${object.name}.${fieldName}(${argName}:) is of required type ` +
          `"${String(objectArg.type)}" but is not also provided by the ` +
          `interface ${iface.name}.${fieldName}.`,
          [objectArgAST],
          SEVERITY.error,
        ));
      }
    });
  });

  if (missingFields.length > 0) {
    errors.push(newGQLError(
      `Missing interface fields [${missingFields.map(field => field.name).join(', ')}]`,
      // $FlowDisableNextLine (node is dynamic property added)
      [object.node],
      SEVERITY.error,
    ));
  }

  return errors;
}
