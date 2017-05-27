/* @flow */
import { Source, parse as parseGraphQLDocument } from 'graphql';
import { type QueryConfigResolved } from 'gql-config/types';
import { toGQLError, SEVERITY } from 'gql-shared/GQLError';
import createParser from 'gql-shared/createParser';

import ParsedQueryDocument from './ParsedQueryDocument';
import ParsedQueryFile from './ParsedQueryFile';
import extractQueryDocuments from './extractQueryDocuments';

export default function parseQueryFile(
  source: Source,
  config: QueryConfigResolved,
): ParsedQueryFile {
  const queryDocuments = extractQueryDocuments(
    source,
    createParser(config.parser),
  );
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
