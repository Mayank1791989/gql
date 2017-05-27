/* @flow */
import TypeInfoContext from 'gql-shared/TypeInfoContext';
import { GQLSchema } from 'gql-shared/GQLSchema';
import { type QueryConfigResolved } from 'gql-config/types';
import GQLFragmentsManager, {
  GQLFragment,
} from 'gql-shared/GQLFragmentsManager';

export default class QueryContext extends TypeInfoContext {
  _fragmentsManager: GQLFragmentsManager;
  _config: QueryConfigResolved;

  constructor(
    schema: GQLSchema,
    fragmentsManager: GQLFragmentsManager,
    config: QueryConfigResolved,
  ) {
    super(schema);
    this._fragmentsManager = fragmentsManager;
    this._config = config;
  }

  getConfig(): QueryConfigResolved {
    return this._config;
  }

  getFragmentsManager(): GQLFragmentsManager {
    return this._fragmentsManager;
  }

  getFragments(name: string): $ReadOnlyArray<GQLFragment> {
    return this._fragmentsManager.getFragments(
      this._config.fragmentScopes,
      name,
    );
  }

  getAllFragments(): $ReadOnlyArray<GQLFragment> {
    return this._fragmentsManager.getAllFragments(this._config.fragmentScopes);
  }

  getParser() {
    // parser has internal state so it should not be cached
    return this.getConfig().parser.create();
  }
}
