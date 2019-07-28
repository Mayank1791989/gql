/* @flow */
/**
 * NOTE: This is patched version of graphql ProvideNonNullArguments rule
 * disable check for mutation as relay manages input variables
 * using differenty syntax (getVariables function)
 * in relay `mutation { someMutation }` is valid
 * but in graphql  `mutation { someMutation(input: $input) { } }` is valid
 */
import {
  missingFieldArgMessage,
  missingDirectiveArgMessage,
  ProvidedNonNullArguments as GraphQLProvidedNonNullArguments,
} from 'graphql/validation/rules/ProvidedNonNullArguments';
import { type QueryValidationRule } from 'gql-query-service';
import { type ASTVisitor } from 'graphql';

export { missingFieldArgMessage, missingDirectiveArgMessage };

/**
 * Provided required arguments
 *
 * A field or directive is only valid if all required (non-null) field arguments
 * have been provided.
 */
export function ProvidedNonNullArguments(): QueryValidationRule {
  return {
    create(context): ASTVisitor {
      const origProvidedNonNullArguments = GraphQLProvidedNonNullArguments(
        context,
      );

      return {
        ...origProvidedNonNullArguments,

        Field: {
          // Validate on leave to allow for deeper errors to appear first.
          leave(node) {
            // eslint-disable-line
            const parentType = context.getParentType();
            // Patch: ignore check for mutations
            if (parentType && parentType.name === 'Mutation') {
              return false;
            }

            // $FlowDisableNextLine
            return origProvidedNonNullArguments.Field.leave(node);
          },
        },
      };
    },
  };
}
