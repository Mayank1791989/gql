/* @flow */
import {
  Source,
  parse,
  concatAST,
  type ParseOptions,
  type BuildSchemaOptions,
} from 'graphql';

import { GQLSchema, extendSchema } from 'gql-shared/GQLSchema';
import { prettyPrintGQLErrors } from 'gql-shared/GQLError';

export default function presetExtendSchema(
  schema: GQLSchema,
  presetsSchema: Array<{ presetName: string, getSchema: () => string }>,
  parseOptions: ParseOptions,
  buildSchemaOptions: BuildSchemaOptions,
) {
  const extensionFiles = {};
  const asts = presetsSchema.map(({ presetName, getSchema }) => {
    const source = new Source(getSchema(), presetName);
    extensionFiles[presetName] = source.body;
    try {
      return parse(source, parseOptions);
    } catch (err) {
      throw new Error(
        `Failed to parse preset '${presetName}' extendSchema\n\n ${err}`,
      );
    }
  });

  const extendSchemaAST = concatAST(asts);

  const result = extendSchema(schema, extendSchemaAST, buildSchemaOptions);

  if (result.extendSchemaErrors.length > 0) {
    throw new Error(
      // eslint-disable-next-line prefer-template
      'Error in preset extendSchema \n\n' +
        prettyPrintGQLErrors(result.extendSchemaErrors, extensionFiles),
    );
  }

  return result.schema;
}
