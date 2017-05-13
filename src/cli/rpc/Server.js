/* @flow */
import _forEach from 'lodash/forEach';
import ipc from 'node-ipc';

type MethodsMap = {
  [name: string]: (
    input: any,
    cb: (err: any, output: mixed) => void,
  ) => void,
};

type Config = $Exact<{
  serverName: string,
  debug?: boolean,
}>;

export default class Server {
  constructor(config: Config, methodsMap: MethodsMap) {
    // setup config
    ipc.config.id = config.serverName;
    ipc.config.silent = !config.debug;
    ipc.config.logInColor = true;

    // create socket
    ipc.serve(() => {
      ipc.log('server started');
    });

    ipc.server.on('ping', (input, socket) => {
      ipc.server.emit(socket, 'ping', { response: true });
    });

    ipc.server.on('stop', () => {
      ipc.server.stop();
    });

    // register rpc methods
    // TODO: somehow listen for events which are not registered
    _forEach(methodsMap, (methodFunc, methodName) => {
      ipc.log('register', methodName);
      ipc.server.on(methodName, (input, socket) => {
        ipc.log('server:', methodName, input);
        methodFunc(input, (error, output) => { // process input
          // emit event for client
          ipc.server.emit(socket, methodName, { error, response: output });
        });
      });
    });
  }

  start(): Promise<void> { // eslint-disable-line class-methods-use-this
    return new Promise((resolve) => {
      ipc.server.start();
      ipc.server.on('start', () => {
        resolve();
      });
    });
  }

  stop(): Promise<void> { // eslint-disable-line class-methods-use-this
    return new Promise((resolve) => {
      ipc.server.stop();
      resolve();
    });
  }
}
