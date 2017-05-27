/* @flow */
import { loadResolverParser } from '../loadParser';
import mockImportModule from 'gql-test-utils/mockImportModule';

describe('Should able loadParser', () => {
  mockImportModule('gql-resolver-parser-test', () => {
    return class TestResolverParser {
      parse() {
        return { kind: 'Document', resolvers: [] };
      }

      getTokenAtPosition() {
        return null;
      }
    };
  });

  ['gql-resolver-parser-test', 'test'].forEach(parser => {
    test(`when parser=${parser}`, () => {
      expect(loadResolverParser(parser, '')).toBeDefined();
    });
  });
});

describe('should report if package not found', () => {
  ['gql-resolver-parser-xtest', 'xtest'].forEach(parser => {
    test(`when parser=${parser}`, () => {
      expect(() => loadResolverParser(parser, '')).toThrowError();
    });
  });
});
