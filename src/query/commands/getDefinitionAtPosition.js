/* @flow */
import {
  type Position,
  type DefLocation,
} from '../../shared/types';
import { getTokenAtPosition } from '../_shared/getTokenAtPosition';
import getDefLocationForNode from '../../shared/getDefLocationForNode';
// import printTokenState from '../shared/printTokenState';
import getTypeInfo from '../_shared/getTypeInfo';
import { type ParserConfig } from '../_shared/types';

import {
  getNamedType,
  type GQLSchema,
} from '../../shared/GQLTypes';

function getDefinitionAtPosition(
  schema: GQLSchema,
  sourceText: string,
  position: Position,
  parserConfig: ParserConfig,
): ?DefLocation {
  // console.log('getDef', sourceText, position);
  // console.time('getDef');
  // console.time('getTokenAtPosition');
  const token = getTokenAtPosition(sourceText, position, parserConfig);
  // console.timeEnd('getTokenAtPosition');
  // console.log('token', token);
  if (!token) { return undefined; }

  const { state } = token;
  // console.time('typeInfo');
  const typeInfo = getTypeInfo(schema, state);
  // console.timeEnd('typeInfo');
  // console.log(state, printTokenState(state));

  // console.log(state.kind, state.step, typeInfo);

  if (
    (state.kind === 'NamedType' && state.step === 0) ||
    (state.kind === 'TypeCondition' && state.step === 1) || // fragment on TypeName <----
    (state.kind === 'Mutation' && state.step === 0) || // ----> mutation { }
    (state.kind === 'Subscription' && state.step === 0) || // ----> subscription { }
    (state.kind === 'Query' && state.step === 0) // ----> query xyz { xyz }
  ) {
    if (typeInfo.type) {
      const type = getNamedType(typeInfo.type);
      if (type) {
        return getDefLocationForNode(type.node);
      }
    }
    return null;
  }

  if (state.kind === 'Field' || state.kind === 'AliasedField') {
    // const node = typeInfo.fieldDef.node;
    if (typeInfo.fieldDef) {
      return getDefLocationForNode(typeInfo.fieldDef.node);
    }
    return null;
  }

  if (state.kind === 'Argument') {
    const { argDef } = typeInfo;
    if (argDef) {
      return getDefLocationForNode(argDef.node);
    }
  }

  if (state.kind === 'ObjectField') {
    const objectField = typeInfo.objectFieldDef;
    if (objectField) {
      return getDefLocationForNode(objectField.node);
    }
    return null;
  }

  if (state.kind === 'Directive' && state.step === 1) {
    const { directiveDef } = typeInfo;
    if (directiveDef) {
      return getDefLocationForNode(directiveDef.node);
    }
  }

  return null;
}

export { getDefinitionAtPosition };
export default getDefinitionAtPosition;

