/* @flow */
import { Source, isCompositeType, getNamedType, isEnumType } from 'graphql';
import { type GQLInfo, type GQLPosition } from 'gql-shared/types';
import getFieldDef from 'gql-shared/getFieldDef';
import ResolverContext from '../shared/ResolverContext';
import invariant from 'invariant';

type Params = {
  context: ResolverContext,
  source: Source,
  position: GQLPosition,
};

export default function getInfoOfTokenAtPosition(
  params: Params,
): $ReadOnlyArray<GQLInfo> {
  const { context } = params;

  const token = context
    .getParser()
    .getTokenAtPosition(params.source, params.position);

  if (!token) {
    return [];
  }

  switch (token.kind) {
    case 'Type':
      return getTypeInfo(context, token);
    case 'ObjectType':
      return getTypeInfo(context, token);
    case 'Scalar':
      return getTypeInfo(context, token);
    case 'Enum':
      return getTypeInfo(context, token);
    case 'ObjectField':
      return getFieldInfo(context, token);
    case 'Field':
      return getFieldInfo(context, token);
    case 'EnumValue':
      return getFieldInfo(context, token);
    case 'Directive': {
      const { name } = token;
      const directive = context.getDirective(name);
      return directive
        ? [{ contents: [context.getPrinter().printDirective(directive)] }]
        : [];
    }
    default:
      // eslint-disable-next-line playlyfe/babel-no-unused-expressions
      (token.kind: empty);
      return invariant(false, 'todo');
  }
}

function getTypeInfo(context, token) {
  const typeName = token.name;
  const type = context.getType(typeName);
  return type ? [{ contents: [context.getPrinter().printType(type)] }] : [];
}

function getFieldInfo(context, token) {
  const { name: fieldName, type: typeName } = token;
  const type = context.getType(typeName);
  if (!type) {
    return [];
  }

  if (isCompositeType(type)) {
    const fieldDef = getFieldDef(context.getSchema(), type, fieldName);
    if (!fieldDef) {
      return [];
    }
    const contents = [];
    contents.push(context.getPrinter().printField(fieldDef));
    // include return type defn also
    const namedType = getNamedType(fieldDef.type);
    if (namedType) {
      contents.push(context.getPrinter().printType(namedType));
    }
    return [{ contents }];
  }

  if (isEnumType(type)) {
    const values = type.getValues();
    const enumValue = values.find(value => value.name === fieldName);
    if (enumValue) {
      return [
        {
          contents: [
            context.getPrinter().printEnumValue(enumValue),
            context.getPrinter().printType(type),
          ],
        },
      ];
    }
  }

  return [];
}
