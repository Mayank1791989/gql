/* @flow */
import {
  onlineParser,
  isIgnored,
  LexRules,
  list,
  p,
} from 'graphql-language-service-parser';

export default function createParser() {
  const _lexRules = {
    ...LexRules,
    Name: new RegExp('^[_A-Za-z][_0-9A-Za-z]*', 'u'),
    Punctuation: new RegExp('^(?:;|=|\\[|\\]|\\/)', 'u'),
  };

  const _parseRules = {
    Document: [list('Resolver')],
    Resolver(token) {
      switch (token.value) {
        case 'resolvers':
          return 'ObjectFieldResolver';
        case 'scalars':
          return 'ScalarTypeResolver';
        case 'enumTypes':
          return 'EnumTypeResolver';
        case 'enumValues':
          return 'EnumValueResolver';
        case 'directives':
          return 'DirectiveResolver';
        case 'types':
          return 'TypeResolver';
        case 'fields':
          return 'FieldResolver';
        default:
          return null;
      }
    },

    ObjectFieldResolver: [
      word('resolvers'),
      p('['),
      type('type'),
      p('/'),
      field('field'),
      p(']'),
      p('='),
      word('func'),
      p(';'),
    ],
    ScalarTypeResolver: [
      word('scalars'),
      p('['),
      type('type'),
      p(']'),
      p('='),
      word('func'),
      p(';'),
    ],
    DirectiveResolver: [
      word('directives'),
      p('['),
      type('type'),
      p(']'),
      p('='),
      word('func'),
      p(';'),
    ],
    EnumValueResolver: [
      word('enumValues'),
      p('['),
      type('type'),
      p('/'),
      value('value'),
      p(']'),
      p('='),
      word('func'),
      p(';'),
    ],
    EnumTypeResolver: [
      word('enumTypes'),
      p('['),
      type('type'),
      p(']'),
      p('='),
      word('func'),
      p(';'),
    ],
    TypeResolver: [
      word('types'),
      p('['),
      type('type'),
      p(']'),
      p('='),
      word('func'),
      p(';'),
    ],
    FieldResolver: [
      word('fields'),
      p('['),
      type('type'),
      p('/'),
      field('field'),
      p(']'),
      p('='),
      word('func'),
      p(';'),
    ],
  };

  return onlineParser({
    eatWhitespace: stream => stream.eatWhile(isIgnored),
    lexRules: _lexRules,
    parseRules: _parseRules,
    editorConfig: {},
  });
}

function word(val) {
  return {
    style: 'keyword',
    match: function match(token) {
      return token.kind === 'Name' && token.value === val;
    },
  };
}

function field(style) {
  return {
    style,
    match: function match(token) {
      return token.kind === 'Name';
    },
    update: function update(state, token) {
      state.name = token.value;
      // $FlowDisableNextLine
      state.field = token.value;
    },
  };
}

function value(style) {
  return {
    style,
    match: function match(token) {
      return token.kind === 'Name';
    },
    update: function update(state, token) {
      state.name = token.value;
      // $FlowDisableNextLine
      state.value = token.value;
    },
  };
}

function type(style) {
  return {
    style,
    match: function match(token) {
      return token.kind === 'Name';
    },
    update: function update(state, token) {
      state.name = token.value;
      state.type = token.value;
    },
  };
}
