/* @flow */
/* eslint-disable complexity */
import getDefLocationForNode from 'gql-shared/getDefLocationForNode';
import { type GQLLocation } from 'gql-shared/types';
import { getNamedType } from 'graphql';
import { type ProviderParams } from './types';

export default function getDefinitionAtPosition(
  params: ProviderParams,
): $ReadOnlyArray<GQLLocation> {
  const { token, context, typeInfo, source, position } = params;
  const { state } = token;

  if (
    (state.kind === 'NamedType' && state.step === 0) ||
    (state.kind === 'TypeCondition' && state.step === 1) || // fragment on TypeName <----
    (state.kind === 'Mutation' && state.step === 0) || // ----> mutation { }
    (state.kind === 'Subscription' && state.step === 0) || // ----> subscription { }
    (state.kind === 'Query' && state.step === 0) // ----> query xyz { xyz }
  ) {
    const type = typeInfo.getType() || typeInfo.getInputType();
    if (type) {
      const namedType = getNamedType(type);
      if (type) {
        return [getDefLocationForNode(namedType.astNode)].filter(Boolean);
      }
    }
    return [];
  }

  if (state.kind === 'Field' || state.kind === 'AliasedField') {
    const fieldDef = typeInfo.getFieldDef();
    if (fieldDef) {
      return [getDefLocationForNode(fieldDef.astNode)].filter(Boolean);
    }
    return [];
  }

  if (state.kind === 'Argument') {
    const argDef = typeInfo.getArgument();
    if (argDef) {
      return [getDefLocationForNode(argDef.astNode)].filter(Boolean);
    }
    return [];
  }

  if (state.kind === 'ObjectField') {
    const objectFieldDef = typeInfo.getObjectFieldDef();
    if (objectFieldDef) {
      return [getDefLocationForNode(objectFieldDef.astNode)].filter(Boolean);
    }
    return [];
  }

  if (state.kind === 'Directive' && state.step === 1) {
    const directiveDef = typeInfo.getDirective();
    if (directiveDef) {
      return [getDefLocationForNode(directiveDef.astNode)].filter(Boolean);
    }
    return [];
  }

  if (state.kind === 'FragmentSpread' && state.name) {
    const fragName = state.name;
    const frags = context
      .getParser()
      .getFragmentDefinitionsAtPosition(context, source, position, fragName);

    if (frags.length > 0) {
      return [getDefLocationForNode(frags[0])].filter(Boolean);
    }
    return [];
  }

  return [];
}
