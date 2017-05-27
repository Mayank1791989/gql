/* @flow */
import TypeInfoContext from 'gql-shared/TypeInfoContext';
import { GQLSchema } from 'gql-shared/GQLSchema';
import { type IResolverParser } from './language/parser';

export default class ResolverContext extends TypeInfoContext {
  _parser: IResolverParser;

  constructor(schema: GQLSchema, parser: IResolverParser) {
    super(schema);
    this._parser = parser;
  }

  getParser() {
    return this._parser;
  }
}
