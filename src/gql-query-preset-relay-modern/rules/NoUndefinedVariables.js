/* @flow */
import {
  GraphQLError,
  type FragmentDefinitionNode,
  type OperationDefinitionNode,
} from 'graphql';
import ValidationContext from '../overrides/ValidationContext';

export function NoUndefinedVariables(context: ValidationContext) {
  let operationVarDefined = Object.create(null);

  return {
    FragmentDefinition: {
      leave(definition: FragmentDefinitionNode) {
        const varDefns = context.getFragmentVariableDefinitions(definition);
        const variableNameDefined = varDefns.reduce((acc, varDef) => {
          acc[varDef.name.value] = true;
          return acc;
        }, {});

        const usages = context.getVariableUsages(definition);
        usages.forEach(({ node }) => {
          const varName = node.name.value;
          if (variableNameDefined[varName] !== true) {
            context.reportError(
              new GraphQLError(
                undefinedFragmentVarMessage(varName, definition.name.value),
                [node, definition],
              ),
            );
          }
        });
      },
    },

    OperationDefinition: {
      enter() {
        operationVarDefined = Object.create(null);
      },

      leave(operation: OperationDefinitionNode) {
        const usages = context.getVariableUsages(operation);
        usages.forEach(({ node }) => {
          const varName = node.name.value;
          if (operationVarDefined[varName] !== true) {
            context.reportError(
              new GraphQLError(
                undefinedOperationVarMessage(
                  varName,
                  operation.name ? operation.name.value : null,
                ),
                [node, operation],
              ),
            );
          }
        });
      },
    },
    VariableDefinition(node) {
      operationVarDefined[node.variable.name.value] = true;
    },
  };
}

function undefinedOperationVarMessage(
  varName: string,
  opName: ?string,
): string {
  return opName
    ? `Variable "$${varName}" is not defined by operation '${opName}'.`
    : `Variable "${varName}" is not defined."`;
}

function undefinedFragmentVarMessage(
  varName: string,
  fragName: string,
): string {
  return (
    `Variable "$${varName}" is not defined by fragment '${fragName}'. ` +
    'Use @argumentDefinitions directive to define variables'
  );
}
