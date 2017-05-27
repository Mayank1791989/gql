/* @flow */
import SchemaParser from 'gql-schema-parser-default';
import EmbeddedQueryParser from 'gql-query-parser-embedded-queries';
import QueryParser from 'gql-query-parser-default';
import QueryPresetRelay from 'gql-query-preset-relay';

export function relayQLParser() {
  return new EmbeddedQueryParser({
    start: 'Relay\\.QL`',
    end: '`',
    allowFragmentWithoutName: true,
    allowFragmentInterpolation: true,
  });
}

export function apolloParser() {
  return new EmbeddedQueryParser({
    start: 'gql`',
    end: '`',
    allowDocumentInterpolation: true,
  });
}

export const relayExtendSchema = QueryPresetRelay().extendSchema;

export function queryParser() {
  return new QueryParser();
}

export function customParser() {
  return new EmbeddedQueryParser({
    start: '"""',
    end: '"""',
  });
}

export function embeddedQueryParser({
  start,
  end,
}: {
  start: string,
  end: string,
}) {
  return new EmbeddedQueryParser({
    start,
    end,
  });
}

export function schemaParser() {
  return new SchemaParser();
}
