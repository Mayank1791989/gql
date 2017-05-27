/* @flow */
import { Source, parse as parseGraphQLDocument } from 'graphql';
import { type QueryConfigResolved } from 'gql-config/types';
import { toGQLError, SEVERITY } from 'gql-shared/GQLError';

import ParsedQueryDocument from './ParsedQueryDocument';
import ParsedQueryFile from './ParsedQueryFile';

export default function parseQueryFile(
  source: Source,
  config: QueryConfigResolved,
): ParsedQueryFile {
  const parser = config.parser.create();
  const queryDocuments = parser.getDocuments(source);

  const parsedQueryDocuments = queryDocuments.map(({ text, match }) => {
    const querySource = new Source(text, source.name);
    try {
      const ast = parseGraphQLDocument(querySource);
      return new ParsedQueryDocument(ast, null, querySource, config, match);
    } catch (err) {
      return new ParsedQueryDocument(
        null,
        toGQLError(err, SEVERITY.error),
        querySource,
        config,
        match,
      );
    }
  });

  return new ParsedQueryFile(parsedQueryDocuments, config);
}
