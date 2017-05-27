/* @flow */
import {
  getNamedType,
  GraphQLError,
  isObjectType,
  type GraphQLNamedType,
} from 'graphql';
import { type QueryValidationRule } from 'gql-query-service';

const CONNECTION_TYPE_FIELDS = ['pageInfo', 'edges'];
const CONNECTION = 'connection';

export function ConnectionDirective(): QueryValidationRule {
  return {
    create(context) {
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
    },
  };
}

function isTypeConnection(type: GraphQLNamedType): boolean {
  if (!isObjectType(type)) {
    return false;
  }
  const typeFields = type.getFields();
  return !CONNECTION_TYPE_FIELDS.find(field => !typeFields[field]);
}
