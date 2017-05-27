/* @flow */
import {
  type GraphQLNamedType,
  type GraphQLDirective,
  type GraphQLEnumType,
  type GraphQLEnumValue,
  type GraphQLField,
  type GraphQLInputField,
} from 'graphql';
import { type GQLHint } from './types';
import { typeName } from './GQLTypes';

export function createHintForType(
  type: GraphQLNamedType | GraphQLDirective,
): GQLHint {
  return {
    text: type.name,
    type: typeName[type.constructor.name],
    description: type.description,
  };
}

export function createHintForEnumValue(
  value: GraphQLEnumValue,
  type: GraphQLEnumType,
): GQLHint {
  return {
    text: value.name,
    type: type.toString(),
    description: value.description,
  };
}

export function createHintForField(
  field: GraphQLField<any, any> | GraphQLInputField,
): GQLHint {
  return {
    text: field.name,
    type: field.type.toString(),
    description: field.description,
  };
}
