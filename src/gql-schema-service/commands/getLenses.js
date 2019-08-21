/* @flow */
import { type GQLLocation } from 'gql-shared/types';
import { GQLSchema } from 'gql-shared/GQLSchema';
import { getLocation } from 'graphql';
import { extractResolversFromSchema } from 'graphql-resolvers-finder/dist';

export default async function getLenses({
  schema,
  filePath,
  type,
}: {
  schema: GQLSchema,
  filePath: string,
  type: 'schema' | 'resolver',
}): ?GQLLocation {
  return type === 'resolver'
    ? Object.values(
        await extractResolversFromSchema(
          [filePath],
          filePath,
          null,
          null,
          schema,
        ),
      )
        .filter(({ filepath }) => filepath === filePath)
        .map(({ fieldLoc, fieldName, typeName }) => ({
          range: {
            start: {
              line: fieldLoc.start.line - 1,
              character: fieldLoc.start.column - 1,
            },
            end: {
              line: fieldLoc.end.line - 1,
              character: fieldLoc.end.column - 1,
            },
          },
          data: {
            typeName,
            fieldName,
            path: filePath,
            type,
          },
        }))
    : Object.values(schema._typeDependenciesMap)
        // Switch to to flatMap once we move to Typescript or vscode supports ES2019
        .reduce((acc, curr) => acc.concat(...curr), [])
        .filter(
          ({ kind, name: { loc } }) =>
            (kind === 'ObjectTypeDefinition' ||
              kind === 'ObjectTypeExtension') &&
            loc.source &&
            loc.source.name === filePath,
        )
        .map(({ fields, name: { value: typeName } }) =>
          fields.map(field => {
            const startLocation = getLocation(
              field.name.loc.source,
              field.name.loc.start,
            );
            const endLocation = getLocation(
              field.name.loc.source,
              field.name.loc.end,
            );
            return {
              range: {
                start: {
                  line: startLocation.line - 1,
                  character: startLocation.column - 1,
                },
                end: {
                  line: endLocation.line - 1,
                  character: endLocation.column - 1,
                },
              },
              data: {
                typeName,
                fieldName: field.name.value,
                path: field.name.loc.source.name,
                type,
              },
            };
          }),
        )
        // Switch to to flatMap once we move to Typescript or vscode supports ES2019
        .reduce((acc, curr) => acc.concat(...curr), []);
}
