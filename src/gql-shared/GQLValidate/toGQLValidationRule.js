/* @flow */
import { ValidationContext, type ASTVisitor } from 'graphql';

export default function toGQLValidationRule<
  TValidationContext: ValidationContext,
>(rule: (context: TValidationContext) => ASTVisitor) {
  return () => {
    return {
      create(context: TValidationContext): ASTVisitor {
        return rule(context);
      },
    };
  };
}
