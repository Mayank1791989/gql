/* @flow */
import { Source } from 'graphql';
import {
  type GQLHint,
  type GQLLocation,
  type GQLInfo,
  type GQLPosition,
  type ISchemaPlugin,
  type SchemaPluginParams,
} from 'gql-shared/types';
import { GQLSchema } from 'gql-shared/GQLSchema';
import GQLBaseService from 'gql-shared/GQLBaseService';
import { memoizeSingle } from 'gql-shared/memoize';
import { type GQLError } from 'gql-shared/GQLError';
import { type WatchFile, type Watcher } from 'gql-watcher';
import ResolverContext from './shared/ResolverContext';
import { parseResolverFile, GQLResolvers } from './shared/document';

import {
  ResolverSchemaValidationContext,
  ResolverValidationContext,
  validate,
} from './shared/validation';
import { IResolverParser } from './shared/language/parser';

import getDefinitionAtPosition from './providers/getDefinitionAtPosition';
import getInfoOfTokenAtPosition from './providers/getInfoOfTokenAtPosition';
import getHintsAtPosition from './providers/getHintsAtPosition';
import getResolverDefns from './providers/getResolverDefns';
import { type ResolverPluginOptionsResolved } from './shared/types';

import path from 'path';
import fs from 'fs';

type CommandParams = {|
  +source: Source,
  +position: GQLPosition,
|};

export default class GQLResolverPlugin extends GQLBaseService
  implements ISchemaPlugin {
  _options: ResolverPluginOptionsResolved;
  _params: SchemaPluginParams;
  _watcher: Watcher;
  _parser: IResolverParser;
  _errors: Array<GQLError> = [];
  _resolvers: GQLResolvers = new GQLResolvers();

  _resolverErrors: Array<GQLError> = [];
  _schemaErrors: Array<GQLError> = [];

  constructor(
    options: ResolverPluginOptionsResolved,
    params: SchemaPluginParams,
  ) {
    super();
    this._options = options;
    this._params = params;
    this._parser = this._options.parser.create();
    this._registerSchemaProviders();
  }

  // to provide jump to schema file from resolvers
  getDefinitionAtPosition(params: CommandParams): $ReadOnlyArray<GQLLocation> {
    return this._catchThrownErrors(() => {
      if (!this._match(params.source.name)) {
        return [];
      }

      return getDefinitionAtPosition({
        context: this._getContext(this._params.schemaService.getSchema()),
        source: params.source,
        position: params.position,
      });
    }, []);
  }

  // to show info of type and field in resolvers
  getInfoOfTokenAtPosition(params: CommandParams): $ReadOnlyArray<GQLInfo> {
    return this._catchThrownErrors(() => {
      if (!this._match(params.source.name)) {
        return [];
      }
      return getInfoOfTokenAtPosition({
        context: this._getContext(this._params.schemaService.getSchema()),
        source: params.source,
        position: params.position,
      });
    }, []);
  }

  // to provide autocomplete for Types and Fields
  getHintsAtPosition(params: CommandParams): $ReadOnlyArray<GQLHint> {
    return this._catchThrownErrors(() => {
      if (!this._match(params.source.name)) {
        return [];
      }
      return getHintsAtPosition({
        context: this._getContext(this._params.schemaService.getSchema()),
        source: params.source,
        position: params.position,
      });
    }, []);
  }

  findRefsOfTokenAtPosition(): $ReadOnlyArray<GQLLocation> {
    return [];
  }

  getErrors(): $ReadOnlyArray<GQLError> {
    return [...this._resolverErrors, ...this._schemaErrors];
  }

  getResolvers(): GQLResolvers {
    return this._resolvers;
  }

  async _handleStart() {
    const params = this._params;

    this._watcher = params.watcher.watch({
      rootPath: params.config.getDir(),
      files: this._options.files,
      onChange: (files: Array<WatchFile>) => {
        try {
          this._updateFiles(files);
        } catch (e) {
          this._triggerError(e);
        }

        this._triggerChange();
      },
    });

    await this._watcher.onReady();
  }

  async _handleStop() {
    if (this._watcher) {
      await Promise.resolve(this._watcher.close());
    }
  }

  _updateFiles(files: Array<WatchFile>) {
    const params = this._params;

    files.forEach(({ name, exists }) => {
      const absPath = path.join(params.config.getDir(), name);
      if (exists) {
        const doc = this._parseFile(absPath);
        this._resolvers.add(absPath, doc);
      } else {
        this._resolvers.remove(absPath);
      }
    });

    // validate merged document
    this._validateMergedDoc();

    this._resolverErrors = this._getResolverErrors();
    this._schemaErrors = this._validateSchema();
  }

  _parseFile = (absPath: string) => {
    const content = fs.readFileSync(absPath, 'utf8');
    const source = new Source(content, absPath);
    const doc = parseResolverFile(source, this._parser);
    // if no parse error then validate
    if (!doc.getParseError()) {
      this._validateDoc(doc);
    }
    return doc;
  };

  _getResolverErrors = () => {
    const errors: Array<GQLError> = [];

    // individual document errors
    this._resolvers.forEachParsedDocument(doc => {
      errors.push(...doc.getErrors());
    });

    // merged document errors
    errors.push(...this._resolvers.getMergedNodeValidationErrors());

    return errors;
  };

  _reValidate = () => {
    this._resolvers.forEachParsedDocument(this._validateDoc);
    this._validateMergedDoc();
    this._resolverErrors = this._getResolverErrors();
    this._schemaErrors = this._validateSchema();
  };

  _validateDoc = doc => {
    const context = this._getValidationContext();
    const errors = validate(
      context,
      doc.getNode(),
      this._options.validate.local,
    );
    doc.setValidationErrors(errors);
  };

  _validateMergedDoc() {
    const context = this._getValidationContext();
    const errors = validate(
      context,
      this._resolvers.getMergedNode(),
      this._options.validate.global,
    );
    this._resolvers.setMergedNodeValidationErrors(errors);
  }

  _validateSchema() {
    return this._params.schemaService.validateSchema(params => {
      return {
        config: this._options.validate.schema,
        createContext: (ast, typeInfo) => {
          return new ResolverSchemaValidationContext(
            this._resolvers,
            params.context,
            ast,
            typeInfo,
          );
        },
      };
    });
  }

  // gen new Context whenever schema changes
  _getContext = memoizeSingle((schema: GQLSchema) => {
    return new ResolverContext(schema, this._parser);
  });

  _getValidationContext = () => {
    return new ResolverValidationContext();
  };

  _match(filePath: string) {
    return this._params.config.match(filePath, this._options.files);
  }

  _registerSchemaProviders() {
    const { schemaService } = this._params;
    schemaService.providers.registerDefinitionProvider(params => {
      return getResolverDefns({
        resolvers: this._resolvers,
        token: params.token,
      });
    });
    schemaService.onChangeSchema(this._reValidate);
  }
}
