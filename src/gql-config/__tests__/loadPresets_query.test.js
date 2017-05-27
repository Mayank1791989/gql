/* @flow */
import { loadQueryPresets } from '../loadPresets';
import { createTempFiles } from 'gql-test-utils/file';

describe('load core-presets:', () => {
  [
    'gql-query-preset-default',
    'gql-query-preset-relay',
    'gql-query-preset-apollo',
  ].forEach(preset => {
    test(`using full package name =${preset}`, () => {
      expect(loadQueryPresets([preset], '')).toBeDefined();
    });
  });

  ['default', 'relay', 'apollo'].forEach(preset => {
    test(`using short package name =${preset}`, () => {
      expect(loadQueryPresets([preset], '')).toBeDefined();
    });
  });
});

describe('missing-preset-pkg', () => {
  [
    'gql-query-preset-custom',
    './custom-preset',
    '@scope/custom',
    'custom_node_module',
  ].forEach(preset => {
    test(`should throw when preset=${preset}`, () => {
      expect(() =>
        loadQueryPresets([preset], ''),
      ).toThrowErrorMatchingSnapshot();
    });
  });
});

describe('custom-preset', () => {
  test('load preset if it is defined in local file', () => {
    const rootPath = createTempFiles({
      'custom-preset': `
        /* this is invalid preset file */
        module.exports = function customPreset() {
          return {
            parserOptions: { },
            validate: {
              rules: {
                someCustomRule : function someCustomRule(context) { },
              },
              config: {
                someCustomRule: 'error',
              },
            }
          };
        };
      `,
    });

    expect(loadQueryPresets(['./custom-preset'], rootPath))
      .toMatchInlineSnapshot(`
Array [
  Object {
    "name": "./custom-preset",
    "preset": Object {
      "parserOptions": Object {},
      "validate": Object {
        "config": Object {
          "someCustomRule": "error",
        },
        "rules": Object {
          "someCustomRule": [Function],
        },
      },
    },
  },
]
`);
  });

  describe('load preset if it is node_module', () => {
    const rootPath = createTempFiles({
      'node_modules/gql-query-preset-custom/package.json': `
        {
          "name": "gql-query-preset-custom",
          "version": "1.0"
        }
      `,
      'node_modules/gql-query-preset-custom/index.js': `
        module.exports = function customPreset() {
          return {
            parserOptions: { },
            validate: {
              rules: {
                someCustomRule: function someCustomRule(context) { },
              },
              config: {
                someCustomRule: 'error',
              },
            }
          };
        };
      `,
    });

    test('using full package name', () => {
      expect(loadQueryPresets(['gql-query-preset-custom'], rootPath))
        .toMatchInlineSnapshot(`
Array [
  Object {
    "name": "gql-query-preset-custom",
    "preset": Object {
      "parserOptions": Object {},
      "validate": Object {
        "config": Object {
          "someCustomRule": "error",
        },
        "rules": Object {
          "someCustomRule": [Function],
        },
      },
    },
  },
]
`);
    });

    test('using short package name', () => {
      expect(loadQueryPresets(['custom'], rootPath)).toMatchInlineSnapshot(`
Array [
  Object {
    "name": "gql-query-preset-custom",
    "preset": Object {
      "parserOptions": Object {},
      "validate": Object {
        "config": Object {
          "someCustomRule": "error",
        },
        "rules": Object {
          "someCustomRule": [Function],
        },
      },
    },
  },
]
`);
    });
  });
});

test('Validation: throw if preset doesnt export function', () => {
  const rootPath = createTempFiles({
    'custom-preset': `
        /* this is invalid preset file */
        module.exports = {
          parserOptions: { }
        };
      `,
  });

  expect(() => {
    loadQueryPresets(['./custom-preset'], rootPath);
  }).toThrowErrorMatchingInlineSnapshot(
    // eslint-disable-next-line playlyfe/babel-quotes
    `"PRESET_PKG_INVALID: expected preset \\"./custom-preset\\" to export \\"function\\" but found \\"object\\""`,
  );
});

test('Validation: throw if preset config invalid', () => {
  const rootPath = createTempFiles({
    'custom-preset': `
        /* this is invalid preset file */
        module.exports = function () {
          return {
            parserOptions: { },
            validate: {},
          };
        };
      `,
  });

  expect(() => {
    loadQueryPresets(['./custom-preset'], rootPath);
  }).toThrowErrorMatchingInlineSnapshot(`
"PRESET_CONFIG_INVALID: There are errors in preset './custom-preset'

QueryPreset.validate.config must be an object

Expected: {
  [ruleName: string]: \\"off\\" | \\"warn\\" | \\"error\\";
}

Actual Value: undefined

Actual Type: void
"
`);
});
