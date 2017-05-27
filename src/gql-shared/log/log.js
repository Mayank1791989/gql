/* @flow */
import Emitter, { type EmitterSubscription } from 'gql-shared/emitter';

const LOG_LEVELS = Object.freeze({
  debug: 'debug',
  info: 'info',
  error: 'error',
});
type LogLevel = $Values<typeof LOG_LEVELS>;

class Logger {
  _timeKeys = new Map();
  _emitter: any;
  _name: string;

  constructor(name, emitter) {
    this._emitter = emitter;
    this._name = name;
  }

  debug(...args: Array<mixed>) {
    this._emit(LOG_LEVELS.debug, ...args);
  }

  info(...args: Array<mixed>) {
    this._emit(LOG_LEVELS.info, ...args);
  }

  error(...args: Array<mixed>) {
    this._emit(LOG_LEVELS.info, ...args);
  }

  time(key: string) {
    if (this._timeKeys.has(key)) {
      console.warn(`Timer '${key}' already exists.`);
      return;
    }
    this._timeKeys.set(key, new Date());
  }

  timeEnd(key: string) {
    const startTime = this._timeKeys.get(key);
    // console.log(startTime);
    if (!startTime) {
      console.warn(`Timer '${key}' does not exist.`);
      return;
    }

    const timeTaken = new Date() - startTime;
    this._timeKeys.delete(key);
    this._emit(LOG_LEVELS.debug, `${key}: ${timeTaken}ms`);
  }

  _emit(level: LogLevel, ...args) {
    this._emitter.emit(level, {
      level,
      name: this._name,
      args,
    });
  }
}

export type LogListener = ({
  +level: LogLevel,
  +name: string,
  +args: Array<mixed>,
}) => void;

export default {
  _emitter: new Emitter(),

  onLog(listener: LogListener): EmitterSubscription {
    const subscriptions = Object.values(LOG_LEVELS).map(eventType => {
      return this._emitter.addListener(eventType, listener);
    });

    return {
      remove() {
        subscriptions.map(subscription => subscription.remove());
      },
    };
  },

  getLogger(name: string): Logger {
    return new Logger(name, this._emitter);
  },
};
