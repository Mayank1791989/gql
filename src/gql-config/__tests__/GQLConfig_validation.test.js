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
  }).toThrowErrorMatchingInlineSnapshot(`
"GQL_CONFIG_FILE_INVALID: Error parsing '.gqlconfig'

GQLConfigFile.schema.files must be one of: Globs | {
  include: Globs;
  ignore?: Globs;
}

Expected: Globs | {
  include: Globs;
  ignore?: Globs;
}

Actual Value: {
  \\"test\\": \\"js/schema/**/*.js\\"
}

Actual Type: {
  test: string;
}
"
`);
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
  }).toThrowErrorMatchingInlineSnapshot(`
"GQL_CONFIG_FILE_INVALID: Error parsing '.gqlconfig'

GQLConfigFile should not contain the key: \\"xquery\\"

Expected: {|
  schema: SchemaConfig;
  query?: {
    files: Array<QueryConfig>;
  };
  version?: SemverVersion;
|}

Actual Value: {
  \\"schema\\": {
    \\"files\\": \\"js/schema/**/*.js\\"
  },
  \\"xquery\\": \\"some_unknown_key\\"
}

Actual Type: {
  schema: {
    files: string;
  };
  xquery: string;
}
"
`);
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
  }).toThrowErrorMatchingInlineSnapshot(`
"GQL_CONFIG_FILE_INVALID: Error parsing '.gqlconfig'

GQLConfigFile.version Not a valid semver version.

Expected: *

Actual Value: \\"this_is_not_semver_version\\"

Actual Type: string
"
`);
});

test('not report error for valid version', () => {
  expect(() => {
    (getPackageVersion: $FixMe).mockReturnValue('3.2.0');
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
    (getPackageVersion: $FixMe).mockReturnValue('2.6.0');
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
  }).toThrowErrorMatchingInlineSnapshot(
    // eslint-disable-next-line playlyfe/babel-quotes
    `"Wrong version of gql. The config specifies version ^3.0.0 but gql version is 2.6.0"`,
  );
});

test('not report error if gql version satisfies config version', () => {
  expect(() => {
    (getPackageVersion: $FixMe).mockReturnValue('3.1.0');
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
