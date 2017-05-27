/* @flow */
/* eslint-disable complexity, init-declarations */
/**
 * NOTE: patched original TypeInfo to use context instead of schema
 */

import TypeInfoContext from '../TypeInfoContext';
import {
  TypeInfo,
  Kind,
  getNamedType,
  isCompositeType,
  isOutputType,
  isEnumType,
  isInputObjectType,
  isObjectType,
  isInputType,
  typeFromAST,
  getNullableType,
  isListType,
  type ASTKindToNode,
  type ASTNode,
} from 'graphql';

import find from 'graphql/jsutils/find';

type Nodes = $Values<ASTKindToNode>;

export default class ValidationTypeInfo extends TypeInfo {
  _context: TypeInfoContext;

  constructor(context: TypeInfoContext) {
    super(context.getSchema());
    this._context = context;
  }

  // FIXME: find some type safe way to do this
  // $FlowDisableNextLine: cant extend with different signature
  enter(
    node: Nodes,
    key: string | number | void,
    parent: Nodes | $ReadOnlyArray<Nodes> | void,
    path: $ReadOnlyArray<string | number>,
    ancestors: $ReadOnlyArray<Nodes | $ReadOnlyArray<Nodes>>,
  ) {
    const context = this._context;
    // Note: many of the types below are explicitly typed as "mixed" to drop
    // any assumptions of a valid schema to ensure runtime types are properly
    // checked before continuing since TypeInfo is used as part of validation
    // which occurs before guarantees of schema and document validity.
    switch (node.kind) {
      case Kind.SELECTION_SET: {
        const namedType: mixed = getNamedType(this.getType());
        this._parentTypeStack.push(
          isCompositeType(namedType) ? namedType : undefined,
        );
        break;
      }
      case Kind.FIELD: {
        const parentType = this.getParentType();
        let fieldDef;
        let fieldType: mixed;
        if (parentType) {
          fieldDef = this._getFieldDef(context.getSchema(), parentType, node);
          if (fieldDef) {
            fieldType = fieldDef.type;
          }
        }
        this._fieldDefStack.push(fieldDef);
        this._typeStack.push(isOutputType(fieldType) ? fieldType : undefined);
        break;
      }
      case Kind.DIRECTIVE: {
        const appliedOnNode: ASTNode = ancestors[ancestors.length - 1];
        this._directive = context.getDirective(node.name.value, {
          kind: appliedOnNode.kind,
          name: appliedOnNode.name ? appliedOnNode.name.value : '',
        });
        break;
      }
      case Kind.OPERATION_DEFINITION: {
        let type: mixed;
        if (node.operation === 'query') {
          type = context.getQueryType();
        } else if (node.operation === 'mutation') {
          type = context.getMutationType();
        } else if (node.operation === 'subscription') {
          type = context.getSubscriptionType();
        }
        this._typeStack.push(isObjectType(type) ? type : undefined);
        break;
      }
      case Kind.INLINE_FRAGMENT:
      case Kind.FRAGMENT_DEFINITION: {
        const typeConditionAST = node.typeCondition;
        const outputType: mixed = typeConditionAST
          ? typeFromAST(context.getSchema(), typeConditionAST)
          : getNamedType(this.getType());
        this._typeStack.push(isOutputType(outputType) ? outputType : undefined);
        break;
      }
      case Kind.VARIABLE_DEFINITION: {
        const inputType: mixed = typeFromAST(context.getSchema(), node.type);
        this._inputTypeStack.push(
          isInputType(inputType) ? inputType : undefined,
        );
        break;
      }
      case Kind.ARGUMENT: {
        let argDef;
        let argType: mixed;
        const fieldOrDirective = this.getDirective() || this.getFieldDef();
        if (fieldOrDirective) {
          argDef = find(
            fieldOrDirective.args,
            arg => arg.name === node.name.value,
          );
          if (argDef) {
            argType = argDef.type;
          }
        }
        this._argument = argDef;
        this._inputTypeStack.push(isInputType(argType) ? argType : undefined);
        break;
      }
      case Kind.LIST: {
        const listType: mixed = getNullableType(this.getInputType());
        const itemType: mixed = isListType(listType)
          ? listType.ofType
          : listType;
        this._inputTypeStack.push(isInputType(itemType) ? itemType : undefined);
        break;
      }
      case Kind.OBJECT_FIELD: {
        const objectType: mixed = getNamedType(this.getInputType());
        let inputFieldType: mixed;
        if (isInputObjectType(objectType)) {
          const inputField = objectType.getFields()[node.name.value];
          if (inputField) {
            inputFieldType = inputField.type;
          }
        }
        this._inputTypeStack.push(
          isInputType(inputFieldType) ? inputFieldType : undefined,
        );
        break;
      }
      case Kind.ENUM: {
        const enumType: mixed = getNamedType(this.getInputType());
        let enumValue;
        if (isEnumType(enumType)) {
          enumValue = enumType.getValue(node.value);
        }
        this._enumValue = enumValue;
        break;
      }
      default:
        break;
    }
  }
}
