/* @flow */
import GQLSchemaService from 'gql-schema-service';
import GQLQueryService from 'gql-query-service';
import GQLConfig from 'gql-config';
import GQLWatcher from 'gql-watcher';
import GQLBaseService from 'gql-shared/GQLBaseService';
import GQLSchema from 'gql-shared/GQLSchema';
import log, { type LogListener } from 'gql-shared/log';
import { Source } from 'graphql';

const logger = log.getLogger('gql');

import {
  type GQLHint,
  type GQLInfo,
  type GQLLocation,
  type GQLPosition,
} from 'gql-shared/types';

import { type GQLError } from 'gql-shared/GQLError';

type Options = $ReadOnly<{|
  configDir?: string,

  // watch
  watchman?: boolean,
  watch?: boolean,
|}>;

type CommandParams = $ReadOnly<{|
  sourcePath: string,
  sourceText: string,
  position: GQLPosition,
|}>;

export type { Options as GQLServiceOptions };

export default class GQLService extends GQLBaseService {
  _config: GQLConfig;
  _watcher: GQLWatcher;

  _services: [GQLSchemaService, GQLQueryService] = [];

  constructor(_options: ?Options) {
    super();
    const options = _options || {};

    this._config = new GQLConfig({
      configDir: options.configDir || process.cwd(),
    });
    this._watcher = new GQLWatcher({
      watchman: options.watchman,
      watch: options.watch,
    });

    // setup schema service
    const schemaService = new GQLSchemaService({
      config: this._config,
      watcher: this._watcher,
    });
    schemaService.onChange(this._triggerChange);
    schemaService.onError(this._triggerError);
    this._services[0] = schemaService;

    // setup query service
    if (this._config.getQueryConfig()) {
      const queryService = new GQLQueryService({
        config: this._config,
        schemaService,
        watcher: this._watcher,
      });
      queryService.onChange(this._triggerChange);
      queryService.onError(this._triggerError);
      this._services[1] = queryService;
    }
  }

  onLog(listener: LogListener) {
    return log.onLog(listener);
  }

  async _handleStart() {
    // start schema service
    await Promise.all(this._services.map(service => service.start()));
  }

  async _handleStop() {
    await Promise.all(this._services.map(service => service.stop()));
  }

  getSchema(): GQLSchema {
    const [schemaService] = this._services;
    return schemaService.getSchema();
  }

  getConfig(): GQLConfig {
    return this._config;
  }

  status(): Array<GQLError> {
    if (!this._isRunning) {
      return [];
    }
    try {
      return this._services.reduce((acc, service) => {
        return acc.concat(service.getErrors());
      }, []);
    } catch (err) {
      this._triggerError(err);
      return [];
    }
  }

  autocomplete(params: CommandParams): $ReadOnlyArray<GQLHint> {
    return this._catchThrownErrors(() => {
      logger.debug('autocomplete request');
      if (!this._isRunning) {
        return [];
      }

      logger.time('autocomplete response');
      const position = {
        line: params.position.line,
        column: params.position.column - 1,
      };
      const results = this._services.reduce((acc, service) => {
        acc.push(
          ...service.getHintsAtPosition({
            source: new Source(params.sourceText, params.sourcePath),
            position,
          }),
        );
        return acc;
      }, []);
      logger.timeEnd('autocomplete response');

      return results;
    }, []);
  }

  getDef(params: CommandParams): $ReadOnlyArray<GQLLocation> {
    return this._catchThrownErrors(() => {
      logger.debug('getDef request');
      if (!this._isRunning) {
        return [];
      }

      logger.time('getDef response');
      const results = this._services.reduce((acc, service) => {
        acc.push(
          ...service.getDefinitionAtPosition({
            source: new Source(params.sourceText, params.sourcePath),
            position: params.position,
          }),
        );
        return acc;
      }, []);
      logger.timeEnd('getDef response');

      return results;
    }, []);
  }

  findRefs(params: CommandParams): $ReadOnlyArray<GQLLocation> {
    return this._catchThrownErrors(() => {
      logger.debug('findRefs request');
      if (!this._isRunning) {
        return [];
      }

      logger.time('findRefs response');
      const results = this._services.reduce((acc, service) => {
        acc.push(
          ...service.findRefsOfTokenAtPosition({
            source: new Source(params.sourceText, params.sourcePath),
            position: params.position,
          }),
        );
        return acc;
      }, []);
      logger.timeEnd('findRefs response');

      return results;
    }, []);
  }

  getInfo(params: CommandParams): $ReadOnlyArray<GQLInfo> {
    return this._catchThrownErrors(() => {
      logger.debug('getInfo request');
      if (!this._isRunning) {
        return [];
      }

      logger.time('getInfo response');
      const result = this._services.reduce((acc, service) => {
        acc.push(
          ...service.getInfoOfTokenAtPosition({
            source: new Source(params.sourceText, params.sourcePath),
            position: params.position,
          }),
        );
        return acc;
      }, []);
      logger.timeEnd('getInfo response');

      return result;
    }, []);
  }
}
