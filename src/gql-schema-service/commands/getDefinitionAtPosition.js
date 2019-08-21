/* @flow */
import {
  type GQLPosition,
  type GQLLocation,
  type IParser,
} from 'gql-shared/types';
import { GQLSchema, isPlaceholderType } from 'gql-shared/GQLSchema';
import getDefLocationForNode from 'gql-shared/getDefLocationForNode';
import getTokenAtPosition from 'gql-shared/getTokenAtPosition';
import getResolverLocation from 'gql-schema-service/commands/getResolverLocation';
import getSchemaLocation from 'gql-schema-service/commands/getSchemaLocation';
import { isGql } from 'gql-service/GQLService';
import { extractResolversFromSchema } from 'graphql-resolvers-finder';
import { type FileMatchConfig } from '../../gql-config/types';

export default async function getDefinitionAtPosition({
  schema,
  sourceText,
  position,
  parser,
  filePath,
  resolversGlob,
  resolversBaseDir,
}: {
  schema: GQLSchema,
  sourceText: string,
  position: GQLPosition,
  parser: IParser,
  filePath: string,
  resolversGlob?: FileMatchConfig,
  resolversBaseDir?: string,
}): ?GQLLocation {
  if (isGql(filePath)) {
    // console.log('getDef', sourceText, position);
    // console.time('getDef');
    // console.time('getTokenAtPosition');
    const token = getTokenAtPosition(parser, sourceText, position);
    // console.timeEnd('getTokenAtPosition');
    // console.log('token', token);
    if (!token) {
      return null;
    }

    const { state } = token;

    // console.log(state.kind, state.step);

    if (
      state.kind === 'NamedType' ||
      (state.kind === 'UnionDef' && state.step === 4) || // union Type = Type1<-----
      (state.kind === 'UnionMember' && state.step === 1) || // union Type = Type1 | Type2<------
      (state.kind === 'Implements' && state.step === 1) ||
      (state.kind === 'ObjectTypeDef' &&
        state.prevState &&
        state.prevState.kind === 'ExtendDef')
    ) {
      const { name } = state;
      if (name) {
        const type = schema.getType(name);
        if (type && !isPlaceholderType(type)) {
          return getDefLocationForNode(type.astNode);
        }
      }
    } else if (state.kind === 'FieldDef') {
      for (const typeNodes of Object.values(schema._typeDependenciesMap)) {
        const node = typeNodes.find(
          ({ kind, name: { loc } }) =>
            (kind === 'ObjectTypeDefinition' ||
              kind === 'ObjectTypeExtension') &&
            loc.source &&
            loc.source.name === filePath,
        );
        if (node && node.loc.start < token.start && node.loc.end > token.end) {
          const fieldType = node.name.value;
          const fieldName = state.name;
          return getResolverLocation(
            fieldType,
            fieldName,
            schema,
            resolversGlob,
            resolversBaseDir,
          );
        }
      }
    }
  } else {
    const resolvers = await extractResolversFromSchema(
      [filePath],
      filePath,
      null,
      null,
      schema,
    );

    const { fieldName, typeName } =
      Object.values(resolvers).find(
        ({ filepath, fieldLoc }) =>
          filepath === filePath &&
          fieldLoc.start.line <= position.line &&
          fieldLoc.end.line >= position.line &&
          fieldLoc.start.column <= position.column &&
          fieldLoc.end.column >= position.column,
      ) || {};
    if (fieldName && typeName) {
      return getSchemaLocation(typeName, fieldName, schema);
    }
  }
  return null;
}
