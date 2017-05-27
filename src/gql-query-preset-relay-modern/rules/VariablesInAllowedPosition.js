/* @flow */
import {
  type ASTVisitor,
  type FragmentDefinitionNode,
  typeFromAST,
  isTypeSubTypeOf,
  GraphQLNonNull,
  isNonNullType,
  GraphQLError,
} from 'graphql';

import { badVarPosMessage } from 'graphql/validation/rules/VariablesInAllowedPosition';
import { QueryValidationContext } from 'gql-query-service';

export function VariablesInAllowedPosition(
  context: QueryValidationContext,
): ASTVisitor {
  let operationVarDefMap = Object.create(null);

  return {
    FragmentDefinition: {
      leave(fragment: FragmentDefinitionNode) {
        const usages = context.getVariableUsages(fragment);
        const varDefns = context.getFragmentVariableDefinitions(fragment);
        const varDefMap: {
          [name: string]: FragmentVariableDefinition,
        } = varDefns.reduce((acc, varDefn) => {
          acc[varDefn.name.value] = varDefn;
          return acc;
        }, {});

        // iterate usage
        usages.forEach(({ node, type }) => {
          const varName = node.name.value;
          const varDef = varDefMap[varName];
          if (varDef && varDef.type && type) {
            const schema = context.getSchema();
            const varType = typeFromAST(schema, varDef.type);
            if (
              varType &&
              !isTypeSubTypeOf(schema, effectiveType(varType, varDef), type)
            ) {
              context.reportError(
                new GraphQLError(badVarPosMessage(varName, varType, type), [
                  varDef.node,
                  node,
                ]),
              );
            }
          }
        });
      },
    },

    OperationDefinition: {
      enter() {
        operationVarDefMap = Object.create(null);
      },

      leave(operation) {
        const usages = context.getVariableUsages(operation);

        usages.forEach(({ node, type }) => {
          const varName = node.name.value;
          const varDef = operationVarDefMap[varName];
          if (varDef && type) {
            // A var type is allowed if it is the same or more strict (e.g. is
            // a subtype of) than the expected type. It can be more strict if
            // the variable type is non-null when the expected type is nullable.
            // If both are list types, the variable item type can be more strict
            // than the expected item type (contravariant).
            const schema = context.getSchema();
            const varType = typeFromAST(schema, varDef.type);
            if (
              varType &&
              !isTypeSubTypeOf(schema, effectiveType(varType, varDef), type)
            ) {
              context.reportError(
                new GraphQLError(badVarPosMessage(varName, varType, type), [
                  varDef,
                  node,
                ]),
              );
            }
          }
        });
      },
    },

    VariableDefinition(node) {
      operationVarDefMap[node.variable.name.value] = node;
    },
  };
}

function effectiveType(varType, varDef) {
  return !varDef.defaultValue || isNonNullType(varType)
    ? varType
    : GraphQLNonNull(varType);
}
