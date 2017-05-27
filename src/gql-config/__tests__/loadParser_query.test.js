/* @flow */
import { loadQueryParser } from '../loadParser';

describe('load core-parsers:', () => {
  [
    'gql-query-parser-default',
    'default',
    'gql-query-parser-embedded-queries',
    'embedded-queries',
  ].forEach(parser => {
    test(`using full package name =${parser}`, () => {
      expect(loadQueryParser(parser, '')).toBeDefined();
    });
  });

  ['default', 'embedded-queries'].forEach(parser => {
    test(`using short package name =${parser}`, () => {
      expect(loadQueryParser(parser, '')).toBeDefined();
    });
  });
});

describe('missing-parser-pkg', () => {
  [
    'gql-query-parser-unknown',
    './custom-parser',
    '@scope/custom-parser',
    'custom_node_module_parser',
  ].forEach(parserPkg => {
    expect(() => loadQueryParser(parserPkg, '')).toThrowErrorMatchingSnapshot();
  });
});
