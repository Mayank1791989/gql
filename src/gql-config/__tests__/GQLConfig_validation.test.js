/* @flow */
import GQLConfig from '../GQLConfig';
import { createTempFiles } from 'gql-test-utils/file';

test('invalid-gqlconfig: validate .gqlconfig file content', () => {
  expect(() => {
    // eslint-disable-next-line no-unused-vars
    const gqlConfig = new GQLConfig({
      configDir: createTempFiles({
        '.gqlconfig': `
          {
            schema: {
              files: { test: 'js/schema/**/*.js' },
            }
          }
        `,
      }),
    });
  }).toThrowErrorMatchingSnapshot();
});

test.skip('report if any extra key passed in config (to detect typos)', () => {
  expect(() => {
    // eslint-disable-next-line no-unused-vars
    const gqlConfig = new GQLConfig({
      configDir: createTempFiles({
        '.gqlconfig': `
          {
            schema: {
              files: 'js/schema/**/*.js',
            },
            xquery: 'some_unknown_key'
          }
        `,
      }),
    });
  }).toThrowErrorMatchingSnapshot();
});

test('can be used only for schema', () => {
  expect(() => {
    // eslint-disable-next-line no-unused-vars
    const gqlConfig = new GQLConfig({
      configDir: createTempFiles({
        '.gqlconfig': `
          {
            schema: {
              files: "tester/**/*.js"
            }
          }
        `,
      }),
    });
  }).not.toThrowError();
});

test('report invalid version', () => {
  expect(() => {
    // eslint-disable-next-line no-unused-vars
    const gqlConfig = new GQLConfig({
      configDir: createTempFiles({
        '.gqlconfig': `
          {
            schema: {
              files: "tester/**/*.js"
            },
            version: 'mayank',
          }
        `,
      }),
    });
  }).toThrowErrorMatchingSnapshot();
});
