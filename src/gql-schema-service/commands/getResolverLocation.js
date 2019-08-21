/* @flow */
import { GQLSchema } from 'gql-shared/GQLSchema';
import { sync as globSync } from 'glob';
import { extractResolversFromSchema } from 'graphql-resolvers-finder';

export default async function getResolverLocation(
  fieldType: string,
  fieldName: string,
  schema: GQLSchema,
  resolversGlob,
  resolversBaseDir,
) {
  const relevantFiles = globSync(resolversGlob, {
    absolute: true,
    cwd: process.cwd(),
  }).filter(
    file =>
      !file.includes('node_modules') &&
      !file.endsWith('.d.ts') &&
      !file.endsWith('.spec.ts'),
  );

  const resolvers = await extractResolversFromSchema(
    relevantFiles,
    resolversBaseDir,
    fieldType,
    fieldName,
    schema,
  );

  const keys = resolvers && Object.keys(resolvers);

  if (!resolvers || !keys || !keys.length) {
    throw new Error('Cannot extract any matching resolver from the schema');
  }

  if (keys.length > 1) {
    console.error(
      'More than one resolver matches the fieldType/fieldName combination, picking the first one.',
    );
  }

  const resolver = resolvers[keys[0]];

  return {
    ...resolver.node.loc,
    path: resolver.filepath,
  };
}
