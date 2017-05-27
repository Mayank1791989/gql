/* @flow */
import GQLConfig from '../GQLConfig';
import { createTempFiles } from 'gql-test-utils/file';

describe('schema-config', () => {
  test('default case', () => {
    expect(
      new GQLConfig({
        configDir: createTempFiles({
          '.gqlconfig': `
            {
              schema: {
                files: 'file/schema/*.gql',
              }
            }
          `,
        }),
      })._configFileResolved,
    ).toMatchSnapshot();
  });

  test('use custom validation config', () => {
    expect(
      new GQLConfig({
        configDir: createTempFiles({
          '.gqlconfig': `
            {
              schema: {
                files: 'file/schema/*.gql',
                validate: {
                  config: {
                    NoUnusedTypeDefinition: 'error',
                  },
                },
              },
            }
          `,
        }),
      })._configFileResolved,
    ).toMatchSnapshot();
  });

  test('use custom parser', () => {
    const rootPath = createTempFiles({
      './custom-parser.js': `
        module.exports = function customParser() {};
      `,
      '.gqlconfig': `
        {
          schema: {
            files: 'file/schema/*.gql',
            parser: ['./custom-parser', { customParserOption: 5 }],
          },
        }
      `,
    });

    const resolvedConfig = new GQLConfig({ configDir: rootPath })
      ._configFileResolved;
    expect(resolvedConfig).toMatchSnapshot();
    expect(resolvedConfig.schema.parser[0].name).toEqual('customParser');
  });

  test('use custom preset', () => {
    const rootPath = createTempFiles({
      'custom-preset': `
        module.exports = function custonPreset() {
          return {
            parser: 'gql-schema-parser-custom',
            parserOptions: { 'some-option': true },
            validate: {
              rules: {
                someCustomRule: function someCustomRule() {},
              },
              config: {
                someCustomRule: 'warn',
              },
            }
          };
        };
      `,
      'node_modules/gql-schema-parser-custom/package.json': `
        {
          "name": "gql-schema-parser-custom",
          "version": "1.0",
          "main": "index.js"
        }
      `,
      'node_modules/gql-schema-parser-custom/index.js': `
        module.exports = function customParser() {};
      `,
      '.gqlconfig': `
        {
          schema: {
            files: 'file/schema/*.gql',
            presets: ['./custom-preset'],
          },
        }
      `,
    });

    const resolvedConfig = new GQLConfig({ configDir: rootPath })
      ._configFileResolved;
    expect(resolvedConfig).toMatchSnapshot();
  });
});

describe('query-files', () => {
  test('default case', () => {
    expect(
      new GQLConfig({
        configDir: createTempFiles({
          '.gqlconfig': `
            {
              schema: {
                files: 'file/schema/*.gql',
              },
              query: {
                files: [
                  {
                    match: 'files/**.js',
                  },
                ],
              },
            }
          `,
        }),
      })._configFileResolved,
    ).toMatchSnapshot();
  });

  describe('preset', () => {
    ['relay', 'apollo'].forEach(preset => {
      test.skip(`preset: ${preset}`, () => {
        expect(
          new GQLConfig({
            configDir: createTempFiles({
              '.gqlconfig': `
                {
                  schema: {
                    files: 'file/schema/*.gql',
                  },
                  query: {
                    files: [
                      {
                        match: 'files/**.js',
                        presets: ['${preset}'],
                      },
                    ],
                  },
                }
              `,
            }),
          })._configFileResolved,
        ).toMatchSnapshot();
      });
    });

    test('custom-preset', () => {
      const rootPath = createTempFiles({
        'custom-preset': `
          module.exports = function customPreset() {
            return {
              parser: 'gql-query-parser-custom',
              parserOptions: { 'some-option': true },
              validate: {
                rules: {
                  someCustomRule: function someCustomRule() {},
                },
                config: {
                  someCustomRule: 'warn',
                },
              }
            };
          };
        `,
        'node_modules/gql-query-custom/package.json': `
          {
            "name": "gql-query-parser-custom",
            "version": "1.0",
            "main": "index.js"
          }
        `,
        'node_modules/gql-query-parser-custom/index.js': `
          module.exports = function customParser() {};
        `,
        '.gqlconfig': `
          {
            schema: {
              files: 'file/schema/*.gql',
            },
            query: {
              files: [
                {
                  match: 'files/**.js',
                  presets: ['./custom-preset'],
                },
              ],
            },
          }
        `,
      });

      const config = new GQLConfig({ configDir: rootPath });
      expect(config._configFileResolved).toMatchSnapshot();
    });
  });
});
