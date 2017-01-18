/* @flow */
import { Client, Server } from '../index';

const serverName = 'server-test';

const server = new Server({ serverName }, {
  addTwoNumbers(input: { num1: number, num2: number }, cb) {
    const { num1, num2 } = input;
    const sum = num1 + num2;
    cb(null, sum);
  },
});

const client = new Client({ serverName });

test('rpc works', async () => {
  // setup
  try {
    await server.start();
    const sum = await client.command('addTwoNumbers', {
      num1: 1,
      num2: 2,
    });
    expect(sum).toBe(3);
    await server.stop();
  } catch (err) {
    // print error
    console.log(err);
  }
});

