/* @flow */
import { type FragmentDefinitionNode, parseType, Kind } from 'graphql';

import {
  Fragment,
  QueryValidationContext,
  type FragmentVariableDefinition,
} from 'gql-query-service';

const ARGUMENT_DEFINITIONS = 'argumentDefinitions';

export default class RelayModernValidationContext extends QueryValidationContext {
  getFragmentVariableDefinitions(
    node: FragmentDefinitionNode,
  ): Array<FragmentVariableDefinition> {
    const fragment = this.getFragmentsManager().getFragmentByNode(node);
    if (!fragment) {
      console.warn('fragment should be present here');
      return [];
    }

    return getFragmentVariableDefinitions(fragment) || [];
  }
}

export function getFragmentVariableDefinitions(
  fragment: Fragment,
): ?Array<FragmentVariableDefinition> {
  if (!fragment.hasCacheItem('variableDefinitions')) {
    const node = fragment.getNode();

    // find ArgumentDefinitionsDirective
    const directive = (node.directives || []).find(
      ({ name }) => name.value === ARGUMENT_DEFINITIONS,
    );

    if (directive && directive.arguments) {
      const variableDefinitions = [];

      directive.arguments.forEach(arg => {
        const varDef = {
          node: arg,
          name: arg.name,
          defaultValue: null,
          type: null,
        };
        variableDefinitions.push(varDef);

        const argValue = arg.value;

        // if value is not object (wrong case) ignore type and defaultValue
        if (argValue.kind !== Kind.OBJECT) {
          return;
        }

        argValue.fields.forEach(field => {
          const fieldName = field.name.value;
          switch (fieldName) {
            case 'type': {
              const fieldValue = field.value;
              if (fieldValue.kind !== Kind.STRING) {
                break;
              }
              const typeAST = parseType(fieldValue.value);
              varDef.type = typeAST;
              break;
            }
            case 'defaultValue':
              varDef.defaultValue = field.value;
              break;
            default:
              // ignore
              break;
          }
        });
      });
      fragment.setCacheItem('variableDefinitions', variableDefinitions);
    } else {
      fragment.setCacheItem('variableDefinitions', null);
    }
  }
  return fragment.getCacheItem('variableDefinitions');
}
