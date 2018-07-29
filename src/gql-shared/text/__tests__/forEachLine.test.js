/* @flow */
import { forEachLine } from '../index';

// NOTE: not using matchSnaphot as text with lineEnding is printed
// as newline so not possible to differentiate between different lineEndings

test('Correctly iterate when lineEnding is \n', () => {
  const text = 'line 1\nline 2\nline 3\n';
  const mockFn = jest.fn();
  forEachLine(text, mockFn);
  expect(mockFn.mock.calls).toEqual([
    [{ number: 1, text: 'line 1', offset: 0, ending: '\n' }],
    [{ number: 2, text: 'line 2', offset: 7, ending: '\n' }],
    [{ number: 3, text: 'line 3', offset: 14, ending: '\n' }],
  ]);
});

test('Correctly iterate when lineEnding is \n and no new line in the end', () => {
  const text = 'line 1\nline 2\nline 3';
  const mockFn = jest.fn();
  forEachLine(text, mockFn);
  expect(mockFn.mock.calls).toEqual([
    [{ number: 1, text: 'line 1', offset: 0, ending: '\n' }],
    [{ number: 2, text: 'line 2', offset: 7, ending: '\n' }],
    [{ number: 3, text: 'line 3', offset: 14, ending: '' }],
  ]);
});

test('Correctly iterate when lineEnding is \r\n', () => {
  const text = 'line 1\r\nline 2\r\nline 3\r\n';
  const mockFn = jest.fn();
  forEachLine(text, mockFn);
  expect(mockFn.mock.calls).toEqual([
    [{ number: 1, text: 'line 1', offset: 0, ending: '\r\n' }],
    [{ number: 2, text: 'line 2', offset: 8, ending: '\r\n' }],
    [{ number: 3, text: 'line 3', offset: 16, ending: '\r\n' }],
  ]);
});

test('Correctly iterate when lineEnding is \r\n and no new line in the end', () => {
  const text = 'line 1\r\nline 2\r\nline 3';
  const mockFn = jest.fn();
  forEachLine(text, mockFn);
  expect(mockFn.mock.calls).toEqual([
    [{ number: 1, text: 'line 1', offset: 0, ending: '\r\n' }],
    [{ number: 2, text: 'line 2', offset: 8, ending: '\r\n' }],
    [{ number: 3, text: 'line 3', offset: 16, ending: '' }],
  ]);
});

test('Correctly iterate when mixed lineEnding present', () => {
  const text = 'line 1\nline 2\r\nline 3\nline 4\r\n';
  const mockFn = jest.fn();
  forEachLine(text, mockFn);
  expect(mockFn.mock.calls).toEqual([
    [{ number: 1, text: 'line 1', offset: 0, ending: '\n' }],
    [{ number: 2, text: 'line 2', offset: 7, ending: '\r\n' }],
    [{ number: 3, text: 'line 3', offset: 15, ending: '\n' }],
    [{ number: 4, text: 'line 4', offset: 22, ending: '\r\n' }],
  ]);
});
