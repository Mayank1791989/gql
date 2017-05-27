/* @flow */
import { FieldsOnCorrectTypeRule, type FieldNode } from 'graphql';
import { type QueryValidationRule } from 'gql-query-service';

export function createFieldsOnCorrectTypeRule(linkState: boolean) {
  return (): QueryValidationRule => {
    return {
      create(context) {
        return linkState
          ? FieldsOnCorrectTypeRuleWithLinkStateSupport(context)
          : FieldsOnCorrectTypeRule(context);
      },
    };
  };
}

function FieldsOnCorrectTypeRuleWithLinkStateSupport(context) {
  return {
    Field(node) {
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
