/* @flow */
import { Source, parse as parseGraphQLDocument } from 'graphql';
import { type SchemaConfigResolved } from 'gql-config/types';
import { toGQLError, SEVERITY } from 'gql-shared/GQLError';

import ParsedSchemaDocument from './ParsedSchemaDocument';
import ParsedSchemaFile from './ParsedSchemaFile';

export default function parseSchemaFile(
  source: Source,
  config: SchemaConfigResolved,
): ParsedSchemaFile {
  const parser = config.parser.create();
  const documents = parser.getDocuments(source);

  const parsedDocuments = documents.map(({ text, match }) => {
    const sdlSource = new Source(text, source.name);

    try {
      const ast = parseGraphQLDocument(sdlSource, config.graphQLOptions || {});
      return new ParsedSchemaDocument(ast, null, sdlSource, config, match);
    } catch (err) {
      // console.log(
      //   `parsing error ${source.name} ${err} ${JSON.stringify(
      //     config.graphQLOptions,
      //   )}`,
      // );
      return new ParsedSchemaDocument(
        null,
        toGQLError(err, SEVERITY.error),
        sdlSource,
        config,
        match,
      );
    }
  });

  return new ParsedSchemaFile(parsedDocuments, config);
}
