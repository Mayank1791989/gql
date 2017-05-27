/* @flow */
import { printSchema, GraphQLSchema } from 'graphql';

export type Options = {|
  commentDescriptions?: boolean,
|};

export default function generateSchemaSDL(
  schema: GraphQLSchema,
  options?: Options,
) {
  return printSchema(schema, options);
}
