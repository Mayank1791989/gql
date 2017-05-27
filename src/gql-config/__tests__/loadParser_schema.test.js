/* @flow */
import { loadSchemaParser } from '../loadParser';

describe('core-parsers:', () => {
  ['gql-schema-parser-default', 'default'].forEach(parser => {
    test(`should load parser when parser=${parser}`, () => {
      expect(loadSchemaParser(parser, '')).toBeDefined();
    });
  });
});
