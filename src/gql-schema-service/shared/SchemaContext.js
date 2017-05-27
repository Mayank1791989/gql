/* @flow */
import TypeInfoContext from 'gql-shared/TypeInfoContext';
import { type SchemaConfigResolved } from 'gql-config/types';
import { GQLSchema } from 'gql-shared/GQLSchema';

export default class SchemaContext extends TypeInfoContext {
  _config: SchemaConfigResolved;

  constructor(schema: GQLSchema, config: SchemaConfigResolved) {
    super(schema);
    this._config = config;
  }

  getConfig(): SchemaConfigResolved {
    return this._config;
  }
}
