/* @flow */
import newParser from './Parsers/newParser';

import splitLines, { joinLines } from '../../shared/splitLines';
import CharacterStream from 'codemirror-graphql/utils/CharacterStream';
import { Source } from 'graphql/language/source';
import type { DocumentNode } from 'graphql/language/ast';
import { parse } from 'graphql/language/parser';
import whileSafe from '../../shared/whileSafe';

const replaceWithSpace = (text: string, start: number, end: number): string => (
  text.substring(0, start) +
  text.substring(start, end).replace(/\S/g, ' ') +
  text.substring(end)
);

function replaceWithPlaceholderFragment(text: string, start: number, end: number) {
  const fragmentName = 'F'; // dummy frag name
  const str = text.substring(start, end).replace(/[^\s]/g, ',');
  const fragmentStr = `...${fragmentName}`;
  if (/^.{2}\n/.test(str)) {
    // ${
    //    fragment
    //  }
    return str.replace(/^.{2}/, fragmentStr);
  }
  const fragStr = str.replace(new RegExp(`^.{${fragmentStr.length}}`), fragmentStr);

  return text.substring(0, start) + fragStr + text.substring(end);
}


const FRAGMENT_NAME_EXTRACT_REGEXP = /fragment(.*?\s+)on/;
function setFragmentName(
  fragment: string,
  getName: () => string,
  forceReplace?: boolean,
): { fragment: string, name: string } {
  let newName = '';
  const withNewNameFragment = fragment.replace(FRAGMENT_NAME_EXTRACT_REGEXP, (match, p1) => {
    newName = p1.trim();
    const isNameSet = Boolean(p1.trim());
    if (isNameSet && !forceReplace) {
      return match;
    }
    newName = getName();
    const _name = ` ${newName} `;
    const minLength = Math.min(_name.length, p1.length);
    const nameStr = p1.replace(/\w/g, ' ').replace(
      new RegExp(`^.{${minLength}}`),
      _name,
    );
    return `fragment${nameStr}on`;
  });

  return {
    fragment: withNewNameFragment,
    name: newName,
  };
}

type Config = {
  parser: any,
  isRelay?: boolean,
};

export default function parserQueryFile(
  source: Source,
  config: Config,
): { ast: ?DocumentNode, isEmpty: boolean } {
  // console.time('start');
  const parser = newParser(config.parser);
  const state = parser.startState();
  const lines = splitLines(source.body);
  let fragCount = 0;
  const genFragName = () => {
    fragCount += 1;
    return `f${fragCount}`;
  };

  const modifiedLines = lines.map((line) => {
    const stream = new CharacterStream(line);
    let modifiedLine = line;
    whileSafe({
      condition: () => !stream.eol(),
      call: () => {
        const style = parser.token(stream, state);

        if (config.isRelay && stream.current() === 'fragment') {
          modifiedLine = setFragmentName(line, genFragName).fragment;
        }

        if (style === 'ws-2') {
          modifiedLine = replaceWithSpace(
            modifiedLine,
            stream.getStartOfToken(),
            stream.getCurrentPosition(),
          );
        }

        if (style === 'js-frag') {
          // todo
          modifiedLine = replaceWithPlaceholderFragment(
            modifiedLine,
            stream.getStartOfToken(),
            stream.getCurrentPosition(),
          );
        }
      },
    });
    return modifiedLine;
  });

  const modifiedSourceText = `${joinLines(modifiedLines)}`;
  // console.log(modifiedSourceText);
  if (!modifiedSourceText.trim()) {
    return {
      ast: null,
      isEmpty: true,
    };
  }

  const ast = parse(new Source(modifiedSourceText, source.name));
  return {
    ast,
    isEmpty: false,
  };
}
