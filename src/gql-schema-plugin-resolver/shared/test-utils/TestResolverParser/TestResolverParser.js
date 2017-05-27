/* @flow */
import { Source } from 'graphql';
import { type GQLPosition } from 'gql-shared/types';
import { getTokenAtPosition, runParser } from 'gql-shared/GQLParser';
import { type IResolverParser, type ResolverNode } from '../../types';
import createParser from './createParser';

export default class TestResolverParser implements IResolverParser {
  // eslint-disable-next-line no-unused-vars
  parse(source: Source) {
    const resolvers: Array<ResolverNode> = [];
    let activeResolver = {};
    runParser(createParser(), source.body, (stream, state, style) => {
      // start of resolvers
      if (
        (state.kind === 'ObjectFieldResolver' ||
          state.kind === 'ScalarTypeResolver' ||
          state.kind === 'DirectiveResolver' ||
          state.kind === 'EnumTypeResolver' ||
          state.kind === 'EnumValueResolver' ||
          state.kind === 'TypeResolver' ||
          state.kind === 'FieldResolver') &&
        state.step === 0
      ) {
        activeResolver = {};
        activeResolver.kind = state.kind;
        activeResolver.loc = {
          start: stream.getStartOfToken(),
          end: -1,
          source,
        };
      }

      if (style === 'type') {
        activeResolver.name = {
          kind: 'Name',
          value: stream.current(),
          loc: {
            start: stream.getStartOfToken(),
            end: stream.getCurrentPosition(),
            source,
          },
        };
      }

      if (style === 'field' || style === 'value') {
        activeResolver.type = activeResolver.name;
        activeResolver.name = {
          kind: 'Name',
          value: stream.current(),
          loc: {
            start: stream.getStartOfToken(),
            end: stream.getCurrentPosition(),
            source,
          },
        };
      }

      if (
        style === 'keyword' &&
        stream.current() === 'func' &&
        ((state.kind === 'ObjectFieldResolver' && state.step === 7) ||
          (state.kind === 'ScalarTypeResolver' && state.step === 5) ||
          (state.kind === 'DirectiveResolver' && state.step === 5) ||
          (state.kind === 'EnumTypeResolver' && state.step === 5) ||
          (state.kind === 'EnumValueResolver' && state.step === 7) ||
          (state.kind === 'TypeResolver' && state.step === 5) ||
          (state.kind === 'FieldResolver' && state.step === 7))
      ) {
        activeResolver.loc.end = stream.getCurrentPosition();
        resolvers.push(activeResolver);
      }
    });

    return {
      kind: 'ResolverDocument',
      resolvers,
    };
  }

  getTokenAtPosition(source: Source, position: GQLPosition) {
    const token = getTokenAtPosition(createParser(), source.body, position);

    if (!token) {
      return null;
    }

    const { state } = token;

    if (state.kind === 'ScalarTypeResolver' && state.step === 2) {
      return {
        kind: 'Scalar',
        name: state.name || '',
      };
    }

    if (state.kind === 'ObjectFieldResolver') {
      if (state.step === 2) {
        return {
          kind: 'ObjectType',
          name: state.name || '',
        };
      }
      if (state.step === 4) {
        return {
          kind: 'ObjectField',
          name: state.name || '',
          type: state.type || '',
        };
      }
    }

    if (state.kind === 'TypeResolver' && state.step === 2) {
      return {
        kind: 'Type',
        name: state.name || '',
      };
    }

    if (state.kind === 'FieldResolver') {
      if (state.step === 2) {
        return {
          kind: 'Type',
          name: state.name || '',
        };
      }
      if (state.step === 4) {
        return {
          kind: 'Field',
          name: state.name || '',
          type: state.type || '',
        };
      }
    }

    if (state.kind === 'DirectiveResolver' && state.step === 2) {
      return {
        kind: 'Directive',
        name: state.name || '',
      };
    }

    if (state.kind === 'EnumTypeResolver' && state.step === 2) {
      return {
        kind: 'Enum',
        name: state.name || '',
      };
    }

    if (state.kind === 'EnumValueResolver') {
      if (state.step === 2) {
        return {
          kind: 'Enum',
          name: state.name || '',
        };
      }
      if (state.step === 4) {
        return {
          kind: 'EnumValue',
          name: state.name || '',
          type: state.type || '',
        };
      }
    }

    // if (token.style === 'type') {
    //   return {
    //     kind: 'Type',
    //     name: token.string,
    //   };
    // }

    // if (token.style === 'field') {
    //   return {
    //     kind: 'Field',
    //     name: token.string,
    //     typeName: token.state.type || '',
    //   };
    // }

    return null;
  }
}
