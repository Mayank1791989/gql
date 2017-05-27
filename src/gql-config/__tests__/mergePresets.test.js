/* @flow */
import { mergeQueryPresets } from '../mergePresets';

describe('extendSchema', () => {
  test('query preset', () => {
    const preset = mergeQueryPresets([
      {
        name: 'one',
        extendSchema: () =>
          `
            directive @someDirective(
              arg: String!
            ) on FIELD | FRAGMENT_DEFINITION
          `,
      },
      {
        name: 'two',
        parser: 'default',
      },
      {
        name: 'three',
        extendSchema: () =>
          `
            extend type Query {
              age: Int!
            }
          `,
      },
    ]);

    expect(preset.extendSchema).toMatchSnapshot();
  });

  test('schema preset', () => {
    const preset = mergeQueryPresets([
      {
        name: 'one',
        extendSchema: () =>
          `
            directive @someDirective on FIELD_DEFINITION
          `,
      },
      {
        name: 'two',
        parser: 'default',
      },
      {
        name: 'three',
        extendSchema: () =>
          `
            extend type Query {
              age: Int!
            }
          `,
      },
    ]);

    expect(preset.extendSchema).toMatchSnapshot();
  });
});
