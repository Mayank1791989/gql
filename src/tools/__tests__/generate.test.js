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
      if (err) {
        done.fail(err);
        return;
      }
      expect(content).toMatchSnapshot();
      done();
    },
  });

  watch.__triggerChange();
});

test('generate: should handle graphql parse errors', (done) => {
  jest.mock('../../shared/watch');
  const watch = require('../../shared/watch').default;
  const generate = require('../generate').default;

  generate({
    configOptions: {
      cwd: path.resolve(__dirname, './fixtures/error-sample-project/'),
    },
    targets: [
      { type: 'schemaJSON' },
    ],
    callback: (err) => {
      expect(err).toMatchSnapshot();
      done();
    },
  });

  watch.__triggerChange();
});

