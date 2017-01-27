/* @flow */
// patch original rule to remove value from error message
// in ide there is no need to show value.
import { GraphQLError } from 'graphql/error';
import { isValidLiteralValue } from 'graphql/utilities/isValidLiteralValue';
import type { GraphQLType } from 'graphql/type/definition';

export function badValueMessage(
  argName: string,
  type: GraphQLType,
  verboseErrors?: string[],
): string {
  const message = verboseErrors ? `\n${verboseErrors.join('\n')}` : '';
  return (
    `Argument "${argName}" has invalid value ${message}`
  );
}

/**
 * Argument values of correct type
 *
 * A GraphQL document is only valid if all field argument literal values are
 * of the type expected by their position.
 */
export function ArgumentsOfCorrectType(context: any): any {
  return {
    Argument(node) {
      const argDef = context.getArgument();
      if (argDef) {
        const errors = isValidLiteralValue(argDef.type, node.value);
        if (errors && errors.length > 0) {
          context.reportError(new GraphQLError(
            badValueMessage(
              node.name.value,
              argDef.type,
              errors,
            ),
            [node.value],
          ));
        }
      }
      return false;
    },
  };
}
