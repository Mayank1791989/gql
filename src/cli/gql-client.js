/* @flow */
// import { Client } from '../utils/rpc';
// import { SERVER_NAME } from '../shared/constants';
// import { spawn } from 'child_process';
// import path from 'path';
// import retry from 'promise-retry';

// // start server as detached process
// const gqlClient = new Client({ serverName: SERVER_NAME });

// const client = {
//   // start server
//   async start() { // eslint-disable-line consistent-return
//     try {
//       await gqlClient.command('ping');
//       console.error('Server already running');
//     } catch (err) {
//       console.log('Starting server...');
//       const serverProcess = spawn('babel-node', [path.join(__dirname, './gql-server.js')], {
//         detached: true,
//         stdio: 'ignore',
//       });

//       serverProcess.unref();

//       // try connecting to server to check is server started
//       return retry((_retry, number) => {
//         console.log('retry attempt', number);
//         return (
//           gqlClient.command('ping')
//           .then(() => { console.log('Server started'); })
//           .catch(_retry)
//         );
//       });
//     }
//   },

//   // stop server
//   async stop() {
//     try {
//       await gqlClient.command('stop');
//     } catch (err) {
//       console.error(err);
//     }
//   },

//   async status() {
//     try {
//       const resp = await gqlClient.command('status');
//       console.log('server-response', resp);
//       return resp;
//     } catch (err) {
//       await client.start(); // start server
//       return client.status(); // run command again
//     }
//   },
// };

// export default client;
