/* @flow */
import { loadSchemaPresets } from '../loadPresets';

describe('core-preset', () => {
  ['gql-schema-preset-default'].forEach(preset => {
    test(`should load preset when preset=${preset}`, () => {
      expect(loadSchemaPresets([preset], '')).toBeDefined();
    });
  });

  describe('allow package without `gql-query-preset` prefix', () => {
    ['default'].forEach(preset => {
      test(`should load preset when preset=${preset}`, () => {
        expect(loadSchemaPresets([preset], '')).toBeDefined();
      });
    });
  });
});
