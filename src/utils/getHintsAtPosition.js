/* @flow */
import GraphQLSchema from './GraphQLSchema';
import {
  GraphQLInterfaceType,
  GraphQLObjectType,
  isInputType,
  isOutputType,
} from 'graphql/type/definition';
import { getTokenAtPosition } from './getTokenAtPosition';
import type { Position, Token, TokenState, Hint } from './types';

// type Options = {
//   schema: GraphQLSchema,
//   sourceText: string,
//   position: Position,
// };

function convertTypeToHint(type): Hint {
  return {
    text: type.name,
    type: type.constructor.name,
    description: type.description,
  };
}

function isAlphabet(char) {
  return /[A-Za-z]/.test(char);
}

// function printState(state): string {
//   if (!state) { return ''; }
//   return `{ kind: ${state.kind}, step: ${state.step} } ${printState(state.prevState)}`;
// }

function getHintsForTokenState(
  schema: GraphQLSchema,
  state: TokenState,
  token: Token,
): Array<Hint> {
  if (!state) { return []; }

  const { kind, step } = state;

  if (kind === 'Document' && step === 0) {
    return [
      { text: 'type' },
      { text: 'enum' },
      { text: 'input' },
    ];
  }

  /** ****************** type *******************/
  // type name {
  //    field: <---
  // }
  if (kind === 'FieldDef' && (
    step === 3 || // case field: <---- cursor here
    (step === 4 && isAlphabet(token.prevChar) && token.style === 'punctuation') // field: Type!  when cursor on !
  )) {
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
      if (typeMap[key] instanceof GraphQLInterfaceType) {
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
    (kind === 'InputValueDef' && step === 3 && isAlphabet(token.prevChar) && token.style === 'punctuation') ||
    (kind === 'FieldDef' && step === 2 && token.string === ')')  // case name(first: ) // when cursor on closing bracket ')'
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

  if (kind === 'ListType' && (
    step === 1 ||
    ((step === 3 || step === 2) && isAlphabet(token.prevChar) && token.style === 'punctuation')
  )) {
    const prevState = state.prevState; // { Kind: Type }
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
    return getHintsForTokenState(schema, state.prevState.prevState, token);
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
      if (typeMap[key] instanceof GraphQLObjectType) {
        acc.push(convertTypeToHint(typeMap[key]));
      }
      return acc;
    }, []);
  }

  // union Type = Type1 <--------
  if ((kind === 'UnionDef' && step === 5)) {
    return [{
      text: '|',
      type: 'OR',
      description: 'OR symbol',
    }];
  }
  /** ************** Union ******************/

  return [];
}

export function getHintsAtPosition(
  schema: GraphQLSchema,
  sourceText: string,
  position: Position,
): Array<Hint> {
  // console.time('getTokenAtPosition');
  const token = getTokenAtPosition(sourceText, position);
  // console.timeEnd('getTokenAtPosition');
  // console.log(token);
  // console.log(position, printState(token.state));
  return getHintsForTokenState(schema, token.state, token);
}
