/* @flow */
import { ValidationContext } from 'graphql/validation/validate';
import {
  getNamedType,
  GraphQLError,
  type GraphQLNamedType,
  isObjectType,
} from 'graphql';

const CONNECTION_TYPE_FIELDS = ['pageInfo', 'edges'];
const CONNECTION = 'connection';
function isTypeConnection(type: GraphQLNamedType): boolean {
  if (!isObjectType(type)) {
    return false;
  }
  const typeFields = type.getFields();
  return !CONNECTION_TYPE_FIELDS.find(field => !typeFields[field]);
}

export function ConnectionDirective(context: ValidationContext): any {
  return {
    Directive(node) {
      const directiveName = node.name.value;
      if (directiveName !== CONNECTION) {
        return;
      }

      const fieldDef = context.getFieldDef();
      // NOTE: user can put @connection directive anywhere so fieldDef
      // can be null
      if (!fieldDef) {
        return;
      }

      const fieldType = getNamedType(fieldDef.type);
      if (!isTypeConnection(fieldType)) {
        context.reportError(
          new GraphQLError(
            'directive @connection can only be used on field of type `Connection`.',
            [node],
          ),
        );
      }
    },
  };
}
