/* @flow */
import { mergeQueryPresets } from '../mergePresets';

describe('extendSchema', () => {
  test('query preset', () => {
    const preset = mergeQueryPresets([
      {
        name: 'one',
        preset: {
          extendSchema: () =>
            `
            directive @someDirective(
              arg: String!
            ) on FIELD | FRAGMENT_DEFINITION
          `,
        },
      },
      {
        name: 'two',
        preset: {
          parser: 'default',
        },
      },
      {
        name: 'three',
        preset: {
          extendSchema: () =>
            `
            extend type Query {
              age: Int!
            }
          `,
        },
      },
    ]);

    expect(preset.extendSchema).toMatchInlineSnapshot(`
Array [
  Object {
    "getSchema": [Function],
    "presetName": "one",
  },
  Object {
    "getSchema": [Function],
    "presetName": "three",
  },
]
`);
  });

  test('schema preset', () => {
    const preset = mergeQueryPresets([
      {
        name: 'one',
        preset: {
          extendSchema: () =>
            `
            directive @someDirective on FIELD_DEFINITION
          `,
        },
      },
      {
        name: 'two',
        preset: {
          parser: 'default',
        },
      },
      {
        name: 'three',
        preset: {
          extendSchema: () =>
            `
              extend type Query {
                age: Int!
              }
            `,
        },
      },
    ]);

    expect(preset.extendSchema).toMatchInlineSnapshot(`
Array [
  Object {
    "getSchema": [Function],
    "presetName": "one",
  },
  Object {
    "getSchema": [Function],
    "presetName": "three",
  },
]
`);
  });
});
