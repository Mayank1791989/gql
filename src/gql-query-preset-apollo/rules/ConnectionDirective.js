/* @flow */
import { type DirectiveNode, DirectiveLocation, GraphQLError } from 'graphql';
import getDirectiveLocationForASTPath from 'gql-shared/getDirectiveLocationForASTPath';
import { type QueryValidationContext } from 'gql-query-service';
import suggestionList from 'graphql/jsutils/suggestionList';
import quotedOrList from 'graphql/jsutils/quotedOrList';

export default function ConnectionDirective(context: QueryValidationContext) {
  return {
    Directive(node: DirectiveNode, key, parent, path, ancestors) {
      const candidateLocation = getDirectiveLocationForASTPath(ancestors);
      // check values passed in 'filter' arg is one of the field argument
      if (candidateLocation && candidateLocation === DirectiveLocation.FIELD) {
        const fieldDef = context.getFieldDef();
        if (!fieldDef) {
          return;
        }
        const possibleFilterValues = fieldDef.args.reduce((acc, arg) => {
          acc[arg.name] = true;
          return acc;
        }, {});

        const filterArg = (node.arguments || []).find(
          arg => arg.name.value === 'filter',
        );
        if (!filterArg) {
          return;
        }

        const { value } = filterArg;
        if (value.kind === 'ListValue') {
          value.values.forEach(valueNode => {
            if (
              valueNode.kind === 'StringValue' &&
              !possibleFilterValues[valueNode.value]
            ) {
              context.reportError(
                new GraphQLError(
                  unknownFilterArgValueMessage(
                    valueNode.value,
                    suggestionList(
                      valueNode.value,
                      Object.keys(possibleFilterValues),
                    ),
                  ),
                  [valueNode],
                ),
              );
            }
          });
        }
      }
    },
  };
}

export function unknownFilterArgValueMessage(
  argName: string,
  suggestedArgs: Array<string>,
): string {
  let message = `Unkown filter value "${argName}".`;
  if (suggestedArgs.length) {
    message += ` Did you mean ${quotedOrList(suggestedArgs)}?`;
  }
  return message;
}
