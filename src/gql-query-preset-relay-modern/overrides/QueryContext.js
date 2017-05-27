/* @flow */
import { QueryContext as OrigQueryContext } from 'gql-query-service';
import {
  GraphQLDirective,
  DirectiveLocation,
  typeFromAST,
  valueFromAST,
  isInputType,
  type GraphQLFieldConfigArgumentMap,
} from 'graphql';
import { PLACEHOLDER_TYPES } from 'gql-shared/GQLSchema';
import { type DirectiveAppliedOn } from 'gql-shared/types';
import { GQLFragment } from 'gql-shared/GQLFragmentsManager';
import { getFragmentVariableDefinitions } from './ValidationContext';

export default class QueryContext extends OrigQueryContext {
  getDirective(name: string, appliedOn: ?DirectiveAppliedOn) {
    if (name === 'arguments' && appliedOn && appliedOn.name) {
      const [fragment] = this.getFragments(appliedOn.name);
      if (!fragment) {
        return null;
      }
      const directive = getArgumentsDirective(this, fragment);
      return directive;
    }
    return super.getDirective(name, appliedOn);
  }

  getDirectives(appliedOn: ?DirectiveAppliedOn) {
    const directives = [...super.getDirectives(appliedOn)];
    if (appliedOn && appliedOn.kind === 'FragmentSpread' && appliedOn.name) {
      const [fragment] = this.getFragments(appliedOn.name);
      if (fragment) {
        const argumentsDirective = getArgumentsDirective(this, fragment);
        if (argumentsDirective) {
          directives.push(argumentsDirective);
        }
      }
    }
    return directives;
  }
}

function getArgumentsDirective(
  context: QueryContext,
  fragment: GQLFragment,
): ?GraphQLDirective {
  if (!fragment.hasCacheItem('argumentsDirective')) {
    const varDefns = getFragmentVariableDefinitions(fragment);
    const argumentsDirective = varDefns
      ? new GraphQLDirective({
          name: 'arguments',
          description:
            'used to pass arguments to a fragment that was defined using @argumentDefinitions',
          locations: [DirectiveLocation.FRAGMENT_SPREAD],
          args: varDefns.reduce(
            (acc: GraphQLFieldConfigArgumentMap, varDef) => {
              const argType = varDef.type
                ? typeFromAST(context.getSchema(), varDef.type)
                : null;

              const argDefaultValue =
                varDef.defaultValue && isInputType(argType)
                  ? valueFromAST(varDef.defaultValue, argType)
                  : undefined;

              acc[varDef.name.value] = {
                type: isInputType(argType)
                  ? argType
                  : PLACEHOLDER_TYPES.inputType(
                      argType ? argType.toString() : 'SOME_ISSUE',
                      (varDef.type: any),
                    ),
                defaultValue: argDefaultValue,
                description: null,
                astNode: {
                  kind: 'InputValueDefinition',
                  loc: varDef.node.loc,
                  name: varDef.name,
                  type: (varDef.type: any),
                  defaultValue: varDef.defaultValue,
                },
              };

              return acc;
            },
            {},
          ),
          astNode: null,
        })
      : null;

    fragment.setCacheItem('argumentsDirective', argumentsDirective);
  }
  return fragment.getCacheItem('argumentsDirective');
}
