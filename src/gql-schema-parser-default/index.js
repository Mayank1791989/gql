/* @flow */
import { type SchemaParserLoadedPkg } from 'gql-config/types';
import SchemaParser from './SchemaParser';

export default function parserPkg(): SchemaParserLoadedPkg {
  return {
    create() {
      return new SchemaParser();
    },
  };
}
