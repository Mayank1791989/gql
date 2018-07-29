/* @flow */
import GQLConfig from '../GQLConfig';
import { createTempFiles } from 'gql-test-utils/file';
import getPackageVersion from 'gql-shared/getPackageVersion';

jest.mock('gql-shared/getPackageVersion', () => {
  return jest.fn();
});

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

test('report if any extra key passed in config (to detect typos)', () => {
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
            version: "this_is_not_semver_version",
          }
        `,
      }),
    });
  }).toThrowErrorMatchingSnapshot();
});

test('not report error for valid version', () => {
  expect(() => {
    getPackageVersion.mockReturnValue('3.2.0');
    // eslint-disable-next-line no-unused-vars
    const gqlConfig = new GQLConfig({
      configDir: createTempFiles({
        '.gqlconfig': `
          {
            schema: {
              files: "tester/**/*.js"
            },
            version: "^3.0.0",
          }
        `,
      }),
    });
  }).not.toThrowError();
});

test('report error if gql version doesnt satisfies config version', () => {
  expect(() => {
    getPackageVersion.mockReturnValue('2.6.0');
    // eslint-disable-next-line no-unused-vars
    const gqlConfig = new GQLConfig({
      configDir: createTempFiles({
        '.gqlconfig': `
          {
            schema: {
              files: "tester/**/*.js"
            },
            version: "^3.0.0",
          }
        `,
      }),
    });
  }).toThrowErrorMatchingSnapshot();
});

test('not report error if gql version satisfies config version', () => {
  expect(() => {
    getPackageVersion.mockReturnValue('3.1.0');
    // eslint-disable-next-line no-unused-vars
    const gqlConfig = new GQLConfig({
      configDir: createTempFiles({
        '.gqlconfig': `
          {
            schema: {
              files: "tester/**/*.js"
            },
            version: "^3.0.0",
          }
        `,
      }),
    });
  }).not.toThrowError();
});
