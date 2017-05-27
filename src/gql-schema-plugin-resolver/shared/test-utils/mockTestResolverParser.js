/* @flow */
import mockImportModule from 'gql-test-utils/mockImportModule';
import TestResolverParser from './TestResolverParser';

export default function mockTestResolverParser(name: string) {
  mockImportModule(name, () => {
    return TestResolverParser;
  });
}
