/* @flow */

/**
 * NOTE: This is patched version of graphql ProvideNonNullArguments rule
 * disable check for mutation as relay manages input variables
 * using differenty syntax (getVariables function)
 * in relay `mutation { someMutation }` is valid
 * but in graphql  `mutation { someMutation(input: $input) { } }` is valid
 */

import { GraphQLError } from 'graphql/error';
import keyMap from 'graphql/jsutils/keyMap';
import { GraphQLNonNull } from 'graphql/type/definition';

import {
  missingFieldArgMessage,
  missingDirectiveArgMessage,
} from 'graphql/validation/rules/ProvidedNonNullArguments';

export {
  missingFieldArgMessage,
  missingDirectiveArgMessage,
};

/**
 * Provided required arguments
 *
 * A field or directive is only valid if all required (non-null) field arguments
 * have been provided.
 */
export function ProvidedNonNullArguments(context: any): any {
  return {
    Field: {
      // Validate on leave to allow for deeper errors to appear first.
      leave(fieldAST) { // eslint-disable-line
        const parentType = context.getParentType();
        // Patch
        // for mutation ignore check
        if (parentType && parentType.name === 'Mutation') {
          return false;
        }

        const fieldDef = context.getFieldDef();
        if (!fieldDef) {
          return false;
        }
        const argASTs = fieldAST.arguments || [];

        const argASTMap = keyMap(argASTs, arg => arg.name.value);
        fieldDef.args.forEach((argDef) => {
          const argAST = argASTMap[argDef.name];
          if (!argAST && argDef.type instanceof GraphQLNonNull) {
            context.reportError(new GraphQLError(
              missingFieldArgMessage(
                fieldAST.name.value,
                argDef.name,
                argDef.type,
              ),
              [fieldAST],
            ));
          }
        });
      },
    },

    Directive: {
      // Validate on leave to allow for deeper errors to appear first.
      leave(directiveAST) { // eslint-disable-line
        const directiveDef = context.getDirective();
        if (!directiveDef) {
          return false;
        }
        const argASTs = directiveAST.arguments || [];

        const argASTMap = keyMap(argASTs, arg => arg.name.value);
        directiveDef.args.forEach((argDef) => {
          const argAST = argASTMap[argDef.name];
          if (!argAST && argDef.type instanceof GraphQLNonNull) {
            context.reportError(new GraphQLError(
              missingDirectiveArgMessage(
                directiveAST.name.value,
                argDef.name,
                argDef.type,
              ),
              [directiveAST],
            ));
          }
        });
      },
    },
  };
}
