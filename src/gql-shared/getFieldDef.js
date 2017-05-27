/* @flow */
import {
  type GraphQLCompositeType,
  SchemaMetaFieldDef,
  TypeMetaFieldDef,
  TypeNameMetaFieldDef,
  isCompositeType,
  isObjectType,
  isInterfaceType,
} from 'graphql';

export default function getFieldDef(
  schema: GQLSchema,
  type: GraphQLCompositeType,
  fieldName: string,
) {
  if (fieldName === SchemaMetaFieldDef.name && schema.getQueryType() === type) {
    return SchemaMetaFieldDef;
  }
  if (fieldName === TypeMetaFieldDef.name && schema.getQueryType() === type) {
    return TypeMetaFieldDef;
  }
  if (fieldName === TypeNameMetaFieldDef.name && isCompositeType(type)) {
    return TypeNameMetaFieldDef;
  }
  if (isObjectType(type) || isInterfaceType(type)) {
    return type.getFields()[fieldName];
  }
  return null;
}
