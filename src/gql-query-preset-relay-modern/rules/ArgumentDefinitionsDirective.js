/* @flow */
import { ValidationContext } from 'graphql/validation/validate';
import {
  GraphQLError,
  type ArgumentNode,
  type FragmentDefinitionNode,
  type ValueNode,
  type GraphQLType,
  type GraphQLInputType,
  type GraphQLSchema,
  type DirectiveNode,
  DirectiveLocation,
  Kind,
  parseType,
  typeFromAST,
  isInputType,
  isValidLiteralValue,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';

import { unknownTypeMessage } from 'graphql/validation/rules/KnownTypeNames';
import suggestionList from 'graphql/jsutils/suggestionList';
import quotedOrList from 'graphql/jsutils/quotedOrList';
import getNamedTypeNode from 'gql-shared/getNamedTypeNode';

const VALID_VALUE_FIELDS = ['type', 'defaultValue'];
const TYPE_VALUE_FIELD_TYPE = GraphQLNonNull(GraphQLString);

export function ArgumentDefinitionsDirective(context: ValidationContext): any {
  return {
    Directive(node: DirectiveNode, key, parent, path, ancestors) {
      const directiveName = node.name.value;
      if (directiveName !== 'argumentDefinitions') {
        return;
      }

      const appliedTo = ancestors[ancestors.length - 1];

      // validate directive location
      if (appliedTo.kind !== Kind.FRAGMENT_DEFINITION) {
        context.reportError(
          new GraphQLError(
            `Directive "argumentDefinitions" can only be used on '${
              DirectiveLocation.FRAGMENT_DEFINITION
            }'`,
            [node],
          ),
        );
        // let user first fixed the location before reporting any other error
        return;
      }

      const directiveArgs = node.arguments;
      if (!directiveArgs) {
        return;
      }

      const fragmentDefinitionNode: FragmentDefinitionNode = appliedTo;
      const variablesUsed = context.getVariableUsages(fragmentDefinitionNode);

      const variablesUsedMap = variablesUsed.reduce((acc, variable) => {
        acc[variable.node.name.value] = true;
        return acc;
      }, {});

      // validate Argument
      directiveArgs.forEach(argument => {
        const argName = argument.name.value;

        // check definition
        validateArgDefinition(context, argument);

        // check variable used
        if (!variablesUsedMap[argName]) {
          context.reportError(
            new GraphQLError(unusedArgDefinition(argName), [argument.name]),
          );
        }
      });
    },
  };
}

function validateArgDefinition(
  context: ValidationContext,
  argNode: ArgumentNode,
) {
  const argValue = argNode.value;

  if (argValue.kind !== Kind.OBJECT) {
    context.reportError(
      new GraphQLError(
        `Expected kind '${Kind.OBJECT}', found '${argValue.kind}'`,
        [argValue],
      ),
    );
    return;
  }

  // validate fields
  // NOTE: duplicate fields is already handled by rule UniqueInputFieldNames
  const fieldsMap: {
    [key: string]: $ElementType<typeof argValue.fields, 0>,
  } = argValue.fields.reduce((acc, field) => {
    const fieldName = field.name.value;
    if (!VALID_VALUE_FIELDS.includes(fieldName)) {
      // report unknownValueField
      context.reportError(
        new GraphQLError(
          unknownValueFieldMessage(
            fieldName,
            suggestionList(fieldName, VALID_VALUE_FIELDS),
          ),
          [field.name],
        ),
      );
    }
    if (!acc[fieldName]) {
      acc[fieldName] = field;
    }
    return acc;
  }, {});

  const typeField = fieldsMap.type;
  if (!typeField) {
    context.reportError(
      new GraphQLError(
        missingValueFieldMessage('type', TYPE_VALUE_FIELD_TYPE),
        [argValue],
      ),
    );
    return;
  }

  // validate type field value
  const { errors, type } = validateTypeFieldValue(
    context.getSchema(),
    typeField.value,
  );
  if (errors.length > 0) {
    errors.forEach(error => context.reportError(error));
  }

  // if defaultValue field provided validate value
  if (type && fieldsMap.defaultValue) {
    const defaultValueValidationErrors = isValidLiteralValue(
      type,
      fieldsMap.defaultValue.value,
    );
    defaultValueValidationErrors.forEach(error => context.reportError(error));
  }
}

function validateTypeFieldValue(
  schema: GraphQLSchema,
  typeFieldValueNode: ValueNode,
): { errors: $ReadOnlyArray<GraphQLError>, type?: GraphQLInputType } {
  const errors = isValidLiteralValue(TYPE_VALUE_FIELD_TYPE, typeFieldValueNode);

  if (errors.length > 0) {
    return { errors };
  }

  if (typeFieldValueNode.kind !== Kind.STRING) {
    return { errors: [] };
  }

  const typeNode = parseType(typeFieldValueNode.value);
  const typeName = getNamedTypeNode(typeNode).name.value;
  const type = typeFromAST(schema, typeNode);

  if (!type) {
    const error = new GraphQLError(
      unknownTypeMessage(
        typeName,
        suggestionList(typeName, Object.keys(schema.getTypeMap())),
      ),
      [typeFieldValueNode],
    );
    return { errors: [error] };
  }

  if (!isInputType(type)) {
    const error = new GraphQLError(`Cannot use non-input type "${typeName}".`, [
      typeFieldValueNode,
    ]);

    return { errors: [error] };
  }

  return { errors: [], type };
}

function unusedArgDefinition(argName: string) {
  return `"${argName}" is defined but never used.`;
}

function missingValueFieldMessage(
  fieldName: string,
  type: GraphQLType,
): string {
  return (
    `Field "${fieldName}" of type ` +
    `"${String(type)}" is required but not provided.`
  );
}

function unknownValueFieldMessage(
  fieldName: string,
  suggestedFields: Array<string>,
): string {
  let message = `Unknown field "${fieldName}".`;
  if (suggestedFields.length) {
    message += ` Did you mean ${quotedOrList(suggestedFields)}?`;
  }
  return message;
}
