/* @flow */
import { graphql, introspectionQuery, GraphQLSchema } from 'graphql';

export default async function generateSchemaJSON(schema: GraphQLSchema, prettify: boolean = true) {
  const response = await graphql(schema, introspectionQuery);
  return (
    prettify
    ? JSON.stringify(response, null, 2)
    : JSON.stringify(response)
  );
}
