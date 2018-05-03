/* @flow */
import {
  type Token,
  type TokenState,
  type GQLHint,
  type GQLPosition,
  type IParser,
} from 'gql-shared/types';
import { typeName } from 'gql-shared/GQLTypes';
import {
  GraphQLObjectType,
  isInterfaceType,
  type GraphQLNamedType,
} from 'graphql';
import { GQLSchema } from 'gql-shared/GQLSchema';
import { isInputType, isOutputType } from 'graphql/type/definition';
import getTokenAtPosition from 'gql-shared/getTokenAtPosition';
import log from 'gql-shared/log';

const logger = log.getLogger('gql');

export default function getHintsAtPosition({
  schema,
  sourceText,
  position: _position,
  parser,
}: {
  schema: GQLSchema,
  sourceText: string,
  position: GQLPosition,
  parser: IParser,
}): Array<GQLHint> {
  const position = { line: _position.line, column: _position.column - 1 };
  logger.time('getTokenAtPosition');
  const token = getTokenAtPosition(parser, sourceText, position);
  logger.timeEnd('getTokenAtPosition');
  return getHintsForTokenState(schema, token.state, token);
}

function convertTypeToHint(type: GraphQLNamedType, kind: string): GQLHint {
  return {
    text: type.name,
    type: typeName[type.constructor.name],
    description: type.description,
    kind,
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
    return [
      { text: 'type', kind },
      { text: 'enum', kind },
      { text: 'input', kind },
    ];
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
      const type = typeMap[key];
      if (isOutputType(typeMap[key])) {
        acc.push(convertTypeToHint(type, kind));
      }
      return acc;
    }, []);
  }

  if (kind === 'ObjectTypeDef' && step === 2) {
    return [
      {
        text: 'implements',
        type: 'Implements',
        kind,
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
      if (isInterfaceType(typeMap[key])) {
        acc.push(convertTypeToHint(typeMap[key], kind));
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
      const type = typeMap[key];
      if (isInputType(typeMap[key])) {
        acc.push(convertTypeToHint(type, 'InputValueDef'));
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
        token.style === 'punctuation')) &&
    (state.prevState && state.prevState.prevState)
  ) {
    return getHintsForTokenState(schema, state.prevState.prevState, token);
  }
  /** **************  List ****************/

  /** *************** Inside Named type ************/
  // field: Str!
  // ---------^
  if (
    ((kind === 'NamedType' && step === 0) ||
      (kind === 'NamedType' && step === 1 && isAlphabet(token.prevChar))) &&
    state.prevState &&
    state.prevState.prevState &&
    state.prevState.prevState.prevState
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
      if (typeMap[key] instanceof GraphQLObjectType) {
        acc.push(convertTypeToHint(typeMap[key], 'UnionDef'));
      }
      return acc;
    }, []);
  }

  /** ************** Union ******************/

  return [];
}
