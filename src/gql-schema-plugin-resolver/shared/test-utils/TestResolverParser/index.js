/* @flow */
import TestResolverParser from './TestResolverParser';
import { type ResolverParserLoadedPkg } from 'gql-schema-plugin-resolver';

export default function parserPkg(): ResolverParserLoadedPkg {
  return {
    create() {
      return new TestResolverParser();
    },
  };
}
