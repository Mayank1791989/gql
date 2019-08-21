/* @flow */
import { GQLSchema } from 'gql-shared/GQLSchema';
import getDefLocationForNode from 'gql-shared/getDefLocationForNode';

export default function getSchemaLocation(
  fieldType: string,
  fieldName: string,
  schema: GQLSchema,
) {
  return getDefLocationForNode(
    schema._typeDependenciesMap[fieldType]
      .filter(
        ({ kind, name: { value } }) =>
          (kind === 'ObjectTypeDefinition' || kind === 'ObjectTypeExtension') &&
          value === fieldType,
      )
      // Switch to to flatMap once we move to Typescript or vscode supports ES2019
      .reduce((acc, { fields }) => acc.concat(fields), [])
      .find(
        field =>
          field.kind === 'FieldDefinition' && field.name.value === fieldName,
      ),
  );
}
