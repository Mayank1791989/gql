/* @flow */
/* eslint-disable complexity */
import getTokenAtPosition from 'gql-shared/getTokenAtPosition';
import getDefLocationForNode from 'gql-shared/getDefLocationForNode';
import TokenTypeInfo from 'gql-shared/TokenTypeInfo';
// import printTokenState from 'gql-shared/printTokenState';
import { type GQLLocation } from 'gql-shared/types';
import { getNamedType } from 'graphql';
import { type CommandParams } from './types';
import getFragmentDefinitionsAtPosition from '../shared/getFragmentDefinitionsAtPosition';

export default function getDefinitionAtPosition({
  context,
  source,
  position,
}: CommandParams): ?GQLLocation {
  // console.log('getDef', sourceText, position);
  // console.time('getDef');
  // console.time('getTokenAtPosition');
  const token = getTokenAtPosition(context.getParser(), source.body, position);
  // console.timeEnd('getTokenAtPosition');
  // console.log('token', token);
  if (!token) {
    return null;
  }

  const { state } = token;
  // console.time('typeInfo');
  const typeInfo = new TokenTypeInfo(context, state);
  // console.timeEnd('typeInfo');
  // console.log(printTokenState(state));
  // console.log(state.kind, state.step, typeInfo);

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
        return getDefLocationForNode(namedType.astNode);
      }
    }
    return null;
  }

  if (state.kind === 'Field' || state.kind === 'AliasedField') {
    const fieldDef = typeInfo.getFieldDef();
    if (fieldDef) {
      return getDefLocationForNode(fieldDef.astNode);
    }
    return null;
  }

  if (state.kind === 'Argument') {
    const argDef = typeInfo.getArgument();
    if (argDef) {
      return getDefLocationForNode(argDef.astNode);
    }
    return null;
  }

  if (state.kind === 'ObjectField') {
    const objectFieldDef = typeInfo.getObjectFieldDef();
    if (objectFieldDef) {
      return getDefLocationForNode(objectFieldDef.astNode);
    }
    return null;
  }

  if (state.kind === 'Directive' && state.step === 1) {
    const directiveDef = typeInfo.getDirective();
    if (directiveDef) {
      return getDefLocationForNode(directiveDef.astNode);
    }
    return null;
  }

  if (state.kind === 'FragmentSpread' && state.name) {
    const fragName = state.name;
    const frags = getFragmentDefinitionsAtPosition(
      context,
      source,
      position,
      fragName,
    );
    if (frags.length > 0) {
      return getDefLocationForNode(frags[0]);
    }
    return null;
  }

  return null;
}
