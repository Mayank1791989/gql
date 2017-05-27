/* @flow */
/* eslint-disable no-use-before-define, no-nested-ternary, complexity, init-declarations */
import { type TokenState } from 'gql-shared/types';
import { forEachState } from 'graphql-language-service-interface/dist/autocompleteUtils';
import TypeInfoContext from './TypeInfoContext';

import {
  type GraphQLArgument,
  type GraphQLInputField,
  type GraphQLField,
  type GraphQLCompositeType,
  type GraphQLEnumValue,
  type GraphQLInputType,
  type GraphQLOutputType,
  type GraphQLInputFieldMap,
  type GraphQLDirective,
  SchemaMetaFieldDef,
  TypeMetaFieldDef,
  TypeNameMetaFieldDef,
  isOutputType,
  getNullableType,
  getNamedType,
  isCompositeType,
  isEnumType,
  isListType,
  isInputType,
  isInputObjectType,
} from 'graphql';

export default class TokenTypeInfo {
  _type: ?GraphQLOutputType;
  _parentType: ?GraphQLCompositeType;
  _directive: ?GraphQLDirective;
  _inputType: ?GraphQLInputType;
  _enumValue: ?GraphQLEnumValue;

  _fieldDef: ?GraphQLField<*, *>;

  _objectFields: ?GraphQLInputFieldMap;
  _objectFieldDef: ?GraphQLInputField;

  _arguments: ?Array<GraphQLArgument>;
  _argument: ?GraphQLArgument;

  constructor(context: TypeInfoContext, tokenState: TokenState) {
    forEachState(tokenState, state => {
      switch (state.kind) {
        case 'Query':
        case 'ShortQuery':
          this._type = context.getQueryType();
          break;
        case 'Mutation':
          this._type = context.getMutationType();
          break;
        case 'Subscription':
          this._type = context.getSubscriptionType();
          break;
        case 'InlineFragment':
        case 'FragmentDefinition': {
          const outputType: mixed = state.type
            ? context.getType(state.type)
            : getNamedType(this.getType());
          this._type = isOutputType(outputType) ? outputType : null;
          break;
        }
        case 'NamedType': {
          const type: mixed = context.getType(state.name);
          this._type = isOutputType(type) ? type : null;
          this._inputType = isInputType(type) ? type : null;
          break;
        }
        case 'SelectionSet': {
          const namedType: mixed = getNamedType(this.getType());
          if (isCompositeType(namedType)) {
            this._parentType = namedType;
          }
          break;
        }
        case 'Field':
        case 'AliasedField':
          if (!this._type || !state.name) {
            this._fieldDef = null;
          } else {
            const parentType = this.getParentType();
            let fieldDef;
            let fieldType: mixed;
            if (parentType) {
              fieldDef = getFieldDef(context, parentType, state.name);
              if (fieldDef) {
                fieldType = fieldDef.type;
              }
            }
            this._fieldDef = fieldDef;
            this._type = isOutputType(fieldType) ? fieldType : null;
          }
          break;
        case 'Directive': {
          const directiveAppliedOn = state.prevState
            ? {
                kind: state.prevState.kind,
                name: state.prevState.name,
              }
            : null;
          this._directive = state.name
            ? context.getDirective(state.name, directiveAppliedOn)
            : null;
          break;
        }
        case 'Arguments': {
          let argDefs;
          const fieldOrDirective = this.getDirective() || this.getFieldDef();
          if (fieldOrDirective) {
            argDefs = fieldOrDirective.args;
          }
          this._arguments = argDefs;
          break;
        }
        case 'Argument': {
          const argDefs = this.getArguments();
          let argDef;
          let argType: mixed;
          if (argDefs) {
            for (let i = 0; i < argDefs.length; i += 1) {
              if (argDefs[i].name === state.name) {
                argDef = argDefs[i];
                break;
              }
            }
            if (argDef) {
              argType = argDef.type;
            }
          }
          this._argument = argDef;
          this._inputType = isInputType(argType) ? argType : null;
          break;
        }
        case 'ListValue': {
          const listType: mixed = getNullableType(this.getInputType());
          const itemType: mixed = isListType(listType) ? listType.ofType : null;
          this._inputType = isInputType(itemType) ? itemType : null;
          break;
        }
        case 'EnumValue': {
          const enumType: mixed = getNamedType(this.getInputType());
          let enumValue;
          if (isEnumType(enumType)) {
            enumValue = enumType.getValue(state.name);
          }
          this._enumValue = enumValue;
          break;
        }
        case 'ObjectValue': {
          const objectType = getNamedType(this.getInputType());
          let objectFields;
          if (isInputObjectType(objectType)) {
            objectFields = objectType.getFields();
          }
          this._objectFields = objectFields;
          break;
        }
        case 'ObjectField': {
          const objectFields = this.getObjectFields();
          let inputFieldType: mixed;
          let objectField;
          if (objectFields) {
            objectField = objectFields[state.name];
            if (objectField) {
              inputFieldType = objectField.type;
            }
          }
          this._objectFieldDef = objectField;
          this._inputType = isInputType(inputFieldType) ? inputFieldType : null;
          break;
        }
        default:
          break;
      }
    });
  }

  getType(): ?GraphQLOutputType {
    return this._type;
  }

  getParentType(): ?GraphQLCompositeType {
    return this._parentType;
  }

  getInputType(): ?GraphQLInputType {
    return this._inputType;
  }

  getObjectFields(): ?GraphQLInputFieldMap {
    return this._objectFields;
  }

  getObjectFieldDef(): ?GraphQLInputField {
    return this._objectFieldDef;
  }

  getFieldDef(): ?GraphQLField<*, *> {
    return this._fieldDef;
  }

  getDirective(): ?GraphQLDirective {
    return this._directive;
  }

  getArguments(): ?Array<GraphQLArgument> {
    return this._arguments;
  }

  getArgument(): ?GraphQLArgument {
    return this._argument;
  }

  getEnumValue(): ?GraphQLEnumValue {
    return this._enumValue;
  }
}

// Gets the field definition given a type and field name
function getFieldDef(context, type, fieldName) {
  if (
    fieldName === SchemaMetaFieldDef.name &&
    context.getQueryType() === type
  ) {
    return SchemaMetaFieldDef;
  }
  if (fieldName === TypeMetaFieldDef.name && context.getQueryType() === type) {
    return TypeMetaFieldDef;
  }
  if (fieldName === TypeNameMetaFieldDef.name && isCompositeType(type)) {
    return TypeNameMetaFieldDef;
  }
  if (type.getFields) {
    // $FlowDisableNextLine
    return type.getFields()[fieldName];
  }
  return null;
}
