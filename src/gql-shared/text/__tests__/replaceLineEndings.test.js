/* @flow */
import { replaceLineEndings, LINE_ENDING } from '../index';

test('correctly replaces all line endings to CRLF', () => {
  const lines = ['Line 1', 'Line 2', 'Line 3'];
  expect(
    replaceLineEndings(lines.join(LINE_ENDING.lf), LINE_ENDING.crlf),
  ).toEqual(lines.join(LINE_ENDING.crlf));
});

test('correctly replaces all line endings to LF', () => {
  const lines = ['Line 1', 'Line 2', 'Line 3'];
  expect(
    replaceLineEndings(lines.join(LINE_ENDING.crlf), LINE_ENDING.lf),
  ).toEqual(lines.join(LINE_ENDING.lf));
});
