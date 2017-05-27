/* @flow */
import { type GQLLocation, type Token } from 'gql-shared/types';
import getDefLocationForNode from 'gql-shared/getDefLocationForNode';
import GQLResolvers from '../shared/document/GQLResolvers';

type Params = {
  resolvers: GQLResolvers,
  token: Token,
};

export default function getResolverDefns(params: Params): Array<GQLLocation> {
  const { token, resolvers } = params;
  const { state } = token;

  // @TODO: make it configurable b/w goTo and codeLens
  // resolver support
  //  type Test {
  //    field: SomeType
  //   ---^
  // }
  //  extend type Test {
  //    field: SomeType
  //   ---^
  // }
  if (
    state.kind === 'FieldDef' &&
    state.step === 0 &&
    // resolvers make sense only for ObjectTypes
    (state.prevState && state.prevState.kind === 'ObjectTypeDef')
  ) {
    const typeName = state.prevState.name;
    const fieldName = state.name;

    if (!fieldName || !typeName) {
      return [];
    }

    const resolverNodes = resolvers.find(typeName, fieldName);
    if (resolverNodes.length > 0) {
      return resolverNodes.map(getDefLocationForNode).filter(Boolean);
    }
  }

  // scalar someScalar
  //  --------^
  if (state.kind === 'ScalarDef' && state.step === 1) {
    const typeName = state.name;
    if (!typeName) {
      return [];
    }

    const resolverNodes = resolvers.find(typeName, null);
    return resolverNodes.map(getDefLocationForNode).filter(Boolean);
  }

  // directive @someDirective() on FIELD
  //  ------------^
  if (state.kind === 'DirectiveDef' && state.step === 2) {
    const typeName = state.name;
    if (!typeName) {
      return [];
    }
    const resolverNodes = resolvers.find(typeName, null);
    return resolverNodes.map(getDefLocationForNode).filter(Boolean);
  }

  // enums
  // console.log(state);
  if (state.kind === 'EnumDef' && state.step === 1) {
    const typeName = state.name;
    if (!typeName) {
      return [];
    }
    const resolverNodes = resolvers.find(typeName, null);
    return resolverNodes.map(getDefLocationForNode).filter(Boolean);
  }

  if (state.kind === 'EnumValueDef' && state.step === 0 && state.prevState) {
    const valueName = state.name;
    const typeName = state.prevState.name;
    if (!valueName || !typeName) {
      return [];
    }
    const resolverNodes = resolvers.find(typeName, valueName);
    return resolverNodes.map(getDefLocationForNode).filter(Boolean);
  }

  return [];
}
