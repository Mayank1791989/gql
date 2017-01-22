/* @flow */
import path from 'path';

test('generate: schemaJSON', (done) => {
  jest.mock('../../shared/watch');
  const watch = require('../../shared/watch').default;
  const generate = require('../generate').default;

  generate({
    configOptions: {
      cwd: path.resolve(__dirname, './fixtures/sample-project/'),
    },
    targets: [
      { type: 'schemaFlow' },
      { type: 'schemaGQL' },
      { type: 'schemaJSON' },
    ],
    callback: (err, content) => {
      expect(content).toMatchSnapshot();
      done();
    },
  });

  watch.__triggerChange();
});
