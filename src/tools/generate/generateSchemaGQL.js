/* @flow */
import { printSchema, GraphQLSchema } from 'graphql';

export default function generateSchemaGQL(schema: GraphQLSchema) {
  return printSchema(schema);
}
