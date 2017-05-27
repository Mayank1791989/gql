/* @flow */
import { Source } from 'graphql';
import { type IResolverParser } from '../language/parser';
import ParsedResolverDocument from './ParsedResolverDocument';
import { toGQLError, SEVERITY } from 'gql-shared/GQLError';

export default function parseResolverFile(
  source: Source,
  parser: IResolverParser,
): ParsedResolverDocument {
  try {
    const ast = parser.parse(source);
    return new ParsedResolverDocument(ast, null, source);
  } catch (err) {
    return new ParsedResolverDocument(
      null,
      toGQLError(err, SEVERITY.error),
      source,
    );
  }
}
