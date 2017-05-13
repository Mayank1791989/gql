/* @flow */
/* eslint-disable class-methods-use-this */
import ipc from 'node-ipc';

type Config = $Exact<{
  serverName: string,
  debug?: boolean,
}>;

export default class Client {
  constructor(config: Config) {
    // set config
    ipc.config.id = config.serverName;
    ipc.config.stopRetrying = true;
    ipc.config.silent = !config.debug;
  }

  command(method: string, input: mixed): Promise<any> {
    return new Promise((resolve, reject) => {
      const serverName = ipc.config.id;

      ipc.connectTo(serverName, () => {
        const server = ipc.of[serverName];

        // connected and emit method
        server.on('connect', () => {
          ipc.log(`connected to "${serverName}"`);
          // call method on server
          server.emit(method, input);
        });

        // listen for method response
        server.on(method, ({ error, response }) => {
          // receive server respons
          ipc.disconnect(serverName); // disconnect client to server
          ipc.log(`${serverName}@${method}:response`, error, response);
          resolve(response); // return response
        });

        server.on('error', (err) => {
          ipc.log('client:error', err);
          reject(err);
        });

        server.on('disconnect', (...args) => {
          ipc.log('disconnect', args);
        });
      });
    });
  }
}
