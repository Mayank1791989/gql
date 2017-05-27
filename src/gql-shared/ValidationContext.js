/* @flow */
import { ValidationContext as OrigValidationContext } from 'graphql';
import ValidationTypeInfo from './ValidationTypeInfo';

export default class ValidationContext extends OrigValidationContext {
  getTypeInfo(): ValidationTypeInfo {
    return this._typeInfo;
  }
}
