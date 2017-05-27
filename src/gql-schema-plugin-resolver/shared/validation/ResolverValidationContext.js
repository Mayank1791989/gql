/* @flow */
import { GQLResolverError } from '../error';

export default class ResolverValidationContext {
  _errors = [];

  reportError(error: GQLResolverError) {
    this._errors.push(error);
  }

  getErrors(): $ReadOnlyArray<GQLResolverError> {
    return this._errors;
  }
}
