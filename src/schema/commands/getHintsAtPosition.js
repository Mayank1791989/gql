/* @flow */
import { isInputType, isOutputType } from 'graphql/type/definition';

import { getTokenAtPosition } from './../_shared/getTokenAtPosition';
import {
  type Position,
  type Token,
  type TokenState,
  type GQLHint,
} from '../../shared/types';
import {
  typeName,
  GQLObjectType,
  GQLInterfaceType,
  type GQLSchema,
} from '../../shared/GQLTypes';
import debug from '../../shared/debug';

function convertTypeToHint(type): GQLHint {
  return {
    text: type.name,
    type: typeName[type.constructor.name],
    description: type.description,
  };
}

function isAlphabet(char) {
  return /[A-Za-z]/.test(char);
}

function getHintsForTokenState(
  schema: GQLSchema,
  state: TokenState,
  token: Token,
): Array<GQLHint> {
  if (!state) {
    return [];
  }

  const { kind, step } = state;
  // console.log(kind, step);

  if (kind === 'Document' && step === 0) {
    return [{ text: 'type' }, { text: 'enum' }, { text: 'input' }];
  }

  /** ****************** type *******************/
  // type name {
  //    field: <---
  // }
  if (
    kind === 'FieldDef' &&
    (step === 3 || // case field: <---- cursor here
      (step === 4 &&
        isAlphabet(token.prevChar) &&
        token.style === 'punctuation')) // field: Type!  when cursor on !
  ) {
    const typeMap = schema.getTypeMap();
    return Object.keys(typeMap).reduce((acc, key) => {
      if (isOutputType(typeMap[key])) {
        acc.push(convertTypeToHint(typeMap[key]));
      }
      return acc;
    }, []);
  }

  if (kind === 'ObjectTypeDef' && step === 2) {
    return [
      {
        text: 'implements',
        type: 'Implements',
      },
      {
        text: '{',
      },
    ];
  }

  if (kind === 'Implements' && step === 1) {
    // all interface types
    const typeMap = schema.getTypeMap();
    return Object.keys(typeMap).reduce((acc, key) => {
      if (typeMap[key] instanceof GQLInterfaceType) {
        acc.push(convertTypeToHint(typeMap[key]));
      }
      return acc;
    }, []);
  }
  /** ****************** type *******************/

  /** ****************** input *******************/
  // type Type {
  //   fielName(inputKey: <---)
  // }
  // or
  // input type {
  //    first: <--
  // }
  if (
    (kind === 'InputValueDef' && step === 2) ||
    (kind === 'InputValueDef' &&
      step === 3 &&
      isAlphabet(token.prevChar) &&
      token.style === 'punctuation') ||
    (kind === 'FieldDef' && step === 2 && token.string === ')') // case name(first: ) // when cursor on closing bracket ')'
  ) {
    const typeMap = schema.getTypeMap();
    return Object.keys(typeMap).reduce((acc, key) => {
      if (isInputType(typeMap[key])) {
        acc.push(convertTypeToHint(typeMap[key]));
      }
      return acc;
    }, []);
  }

  /** ****************** input *******************/

  /** **************  List ****************/
  // type Type {
  //    field: []
  //    -------^
  // }
  // type Type {
  //    field(input: [])
  //    -------------^
  // }
  // input Type {
  //    field: []
  //    -------^
  // }

  if (
    kind === 'ListType' &&
    (step === 1 ||
      ((step === 3 || step === 2) &&
        isAlphabet(token.prevChar) &&
        token.style === 'punctuation'))
  ) {
    const { prevState } = state; // { Kind: Type }
    return getHintsForTokenState(schema, prevState.prevState, token);
  }
  /** **************  List ****************/

  /** *************** Inside Named type ************/
  // field: Str!
  // ---------^
  if (
    (kind === 'NamedType' && step === 0) ||
    (kind === 'NamedType' && step === 1 && isAlphabet(token.prevChar))
  ) {
    return getHintsForTokenState(
      schema,
      state.prevState.prevState.prevState,
      token,
    );
  }
  /** **********************************************

  /**************** Union ******************/
  // union Type =  <---
  // union Type = Type1 | <---
  // union Type = Type1 | Type2 <---
  if (
    (kind === 'UnionDef' && step === 4) || // Union Name =  <--
    (kind === 'UnionMember' && step === 1) // Union Nmae = Type1 | <---
  ) {
    // only GraphQLObjectType
    const typeMap = schema.getTypeMap();
    return Object.keys(typeMap).reduce((acc, key) => {
      if (typeMap[key] instanceof GQLObjectType) {
        acc.push(convertTypeToHint(typeMap[key]));
      }
      return acc;
    }, []);
  }

  /** ************** Union ******************/

  return [];
}

export function getHintsAtPosition(
  schema: GQLSchema,
  sourceText: string,
  _position: Position,
): Array<GQLHint> {
  const position = { line: _position.line, column: _position.column - 1 };
  debug.time('getTokenAtPosition');
  const token = getTokenAtPosition(sourceText, position);
  debug.timeEnd('getTokenAtPosition');
  return getHintsForTokenState(schema, token.state, token);
}
