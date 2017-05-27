/* @flow */
import { Source, isCompositeType, isEnumType } from 'graphql';
import getDefLocationForNode from 'gql-shared/getDefLocationForNode';
import { type GQLLocation, type GQLPosition } from 'gql-shared/types';
import ResolverContext from '../shared/ResolverContext';
import getFieldDef from 'gql-shared/getFieldDef';

type Params = {
  context: ResolverContext,
  source: Source,
  position: GQLPosition,
};

export default function getDefinitionAtPosition(
  params: Params,
): $ReadOnlyArray<GQLLocation> {
  const { context } = params;

  const token = context
    .getParser()
    .getTokenAtPosition(params.source, params.position);

  if (!token) {
    return [];
  }

  if (
    token.kind === 'ObjectType' ||
    token.kind === 'Scalar' ||
    token.kind === 'Enum' ||
    token.kind === 'Type'
  ) {
    const { name } = token;
    const type = context.getType(name);
    if (!type) {
      return [];
    }
    return [getDefLocationForNode(type.astNode)].filter(Boolean);
  }

  if (
    token.kind === 'ObjectField' ||
    token.kind === 'EnumValue' ||
    token.kind === 'Field'
  ) {
    const typeName = token.type;
    const { name } = token;
    const type = context.getType(typeName);
    if (!type) {
      return [];
    }

    if (isCompositeType(type)) {
      const fieldDef = getFieldDef(context.getSchema(), type, name);
      return fieldDef
        ? [getDefLocationForNode(fieldDef.astNode)].filter(Boolean)
        : [];
    }

    if (isEnumType(type)) {
      const values = type.getValues();
      const enumValue = values.find(value => value.name === name);
      return enumValue
        ? [getDefLocationForNode(enumValue.astNode)].filter(Boolean)
        : [];
    }

    return [];
  }

  if (token.kind === 'Directive') {
    const { name } = token;
    const directive = context.getDirective(name);
    if (!directive) {
      return [];
    }
    return [getDefLocationForNode(directive.astNode)].filter(Boolean);
  }

  // eslint-disable-next-line playlyfe/babel-no-unused-expressions
  (token.kind: empty);

  return [];
}
