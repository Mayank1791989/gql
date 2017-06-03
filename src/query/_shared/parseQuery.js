/* @flow */
import newParser from './Parsers/newParser';

import { Source } from 'graphql/language/source';
import { type DocumentNode } from 'graphql/language/ast';
import { parse } from 'graphql/language/parser';
import whileSafe from '../../shared/whileSafe';
import debug from '../../shared/debug';

import MultilineCharacterStream from '../../shared/MultilineCharacterStream';

const IRREGULAR_WHITESPACE = '\f\v\u0085\u00A0\ufeff\u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u202f\u205f\u3000';
const whiteSpaceString = (text) => text.replace(new RegExp(`[\\S${IRREGULAR_WHITESPACE}]`, 'g'), ' ');

function placeholderFragment(text: string) {
  const fragmentName = 'F'; // dummy frag name
  const str = text.replace(/[^\s]/g, ',');
  const fragmentStr = `...${fragmentName}`;
  if (/^.{2}\n/.test(str)) {
    // ${
    //    fragment
    //  }
    return str.replace(/^.{2}/, fragmentStr);
  }
  return str.replace(new RegExp(`^.{${fragmentStr.length}}`), fragmentStr);
}

type Config = {
  parser: any,
  isRelay?: boolean,
};

export function toQueryDocument(source: Source, config: Config): string {
  debug.time('toQueryDocument');
  const parser = newParser(config.parser);
  const state = parser.startState();

  const stream = new MultilineCharacterStream(source.body);
  let queryDocument = '';

  whileSafe({
    condition: () => stream.getCurrentPosition() < source.body.length,
    call: () => {
      const style = parser.token(stream, state);
      // console.log('current', `[${stream.current()}]`, style);
      if ( // add fragment name is missing
        config.isRelay &&
        state.kind === 'TypeCondition' &&
        state.prevState.kind === 'FragmentDefinition' &&
        stream.current() === 'on' &&
        !state.prevState.name
      ) {
        queryDocument += '_ on';
        return;
      }

      if (style === 'ws-2') {
        queryDocument += whiteSpaceString(stream.current());
        return;
      }

      if (style === 'js-frag') {
        queryDocument += placeholderFragment(stream.current());
        return;
      }

      if (style) {
        queryDocument += stream.current();
      }
    },
  }, source.body.length);
  debug.timeEnd('toQueryDocument');
  // console.log(queryDocument);
  return queryDocument;
}

export default function parserQuery(
  source: Source,
  config: Config,
): { ast: ?DocumentNode, isEmpty: boolean } {
  const queryDocument = toQueryDocument(source, config);
  // console.log(queryDocument);

  if (!queryDocument.trim()) {
    return {
      ast: null,
      isEmpty: true,
      queryDocument,
    };
  }

  const ast = parse(new Source(queryDocument, source.name));
  return {
    ast,
    isEmpty: false,
    document: queryDocument,
  };
}
