/* @flow */
import { FieldsOnCorrectTypeRule, type FieldNode } from 'graphql';
import { QueryValidationContext } from 'gql-query-service';

export function createFieldsOnCorrectTypeRule(linkState: boolean) {
  return linkState
    ? FieldsOnCorrectTypeRuleWithLinkStateSupport
    : FieldsOnCorrectTypeRule;
}

function FieldsOnCorrectTypeRuleWithLinkStateSupport(
  context: QueryValidationContext,
) {
  return {
    Field(node: FieldNode) {
      if (checkFieldHasDirective(node, 'client')) {
        return;
      }

      // $FlowDisableNextLine
      FieldsOnCorrectTypeRule(context).Field(node);
    },
  };
}

function checkFieldHasDirective(
  field: FieldNode,
  directiveName: string,
): boolean {
  if (!field.directives) {
    return false;
  }
  return Boolean(
    field.directives.find(dir => dir.name.value === directiveName),
  );
}
