/* @flow */
import type { Position, Token } from './types';
import onlineParser from 'codemirror-graphql/utils/onlineParser';
import CharacterStream from 'codemirror-graphql/utils/CharacterStream';
import { LexRules, ParseRules, isIgnored } from 'codemirror-graphql/utils/Rules';
import invariant from 'graphql/jsutils/invariant';

function splitLines(string) { return string.split(/\r?\n|\r/); }

export function getTokenAtPosition(sourceText: string, position: Position): Token {
  const parser = onlineParser({
    eatWhitespace: stream => stream.eatWhile(isIgnored),
    LexRules,
    ParseRules,
  });
  const state = parser.startState();
  const lines = splitLines(sourceText);
  const { line, column } = position;

  let style;
  let stream;

  for (let index = 0; index < line; index += 1) {
    stream = new CharacterStream(lines[index]);
    if (index < line - 1) { // if not last line
      while (!stream.eol()) {
        style = parser.token(stream, state);
      }
    } else if (index === line - 1) { // if last line run till column
      while (stream.getCurrentPosition() < column && !stream.eol()) {
        style = parser.token(stream, state);
      }
    }
  }

  invariant(style, 'expected style should have some value');
  invariant(stream, 'expected stream should have some value');

  const pos = Math.min(stream.getCurrentPosition(), column - 1);

  return {
    start: stream.getStartOfToken(),
    end: stream.getCurrentPosition(),
    string: stream.current(),
    prevChar: stream._sourceText.charAt(pos - 1),
    state,
    style,
  };
}

