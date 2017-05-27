/* @flow */
import parseFileMatchConfig from '../parseFileMatchConfig';

test('string', () => {
  expect(parseFileMatchConfig('files/**/*.gql')).toMatchSnapshot();
});

test('Array<string>', () => {
  expect(
    parseFileMatchConfig(['files/**/*.gql', 'files2/**/*.gql']),
  ).toMatchSnapshot();
});

test('Object<include: string>', () => {
  expect(
    parseFileMatchConfig({
      include: 'files/**/*.gql',
    }),
  ).toMatchSnapshot();
});

test('Object<include: Array<string>>: single', () => {
  expect(
    parseFileMatchConfig({
      include: ['files/**/*.gql'],
    }),
  ).toMatchSnapshot();
});

test('Object<match: Array<string>>', () => {
  expect(
    parseFileMatchConfig({
      include: ['files/**/*.gql', 'files2/**/*gql'],
    }),
  ).toMatchSnapshot();
});

test('Object<include: Array<string>, ignore: string>', () => {
  expect(
    parseFileMatchConfig({
      include: ['files/**/*.gql', 'files2/**/*gql'],
      ignore: '**/test/**/*.gql',
    }),
  ).toMatchSnapshot();
});

test('Object<match: Array<string>, ignore: Array<string>>', () => {
  expect(
    parseFileMatchConfig({
      include: ['files/**/*.gql', 'files2/**/*gql'],
      ignore: ['**/test/**/*.gql'],
    }),
  ).toMatchSnapshot();
});
