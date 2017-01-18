/* @flow */
import { toMatchExpression } from '../watch';

test('string', () => {
  expect(toMatchExpression('files/**/*.gql')).toMatchSnapshot();
});

test('Array<string>', () => {
  expect(toMatchExpression(['files/**/*.gql', 'files2/**/*.gql'])).toMatchSnapshot();
});

test('Object<include: string>', () => {
  expect(toMatchExpression({
    include: 'files/**/*.gql',
  })).toMatchSnapshot();
});

test('Object<include: Array<string>>: single', () => {
  expect(toMatchExpression({
    include: ['files/**/*.gql'],
  })).toMatchSnapshot();
});

test('Object<match: Array<string>>', () => {
  expect(toMatchExpression({
    include: ['files/**/*.gql', 'files2/**/*gql'],
  })).toMatchSnapshot();
});

test('Object<include: Array<string>, ignore: string>', () => {
  expect(toMatchExpression({
    include: ['files/**/*.gql', 'files2/**/*gql'],
    ignore: '**/test/**/*.gql',
  })).toMatchSnapshot();
});

test('Object<match: Array<string>, ignore: Array<string>>', () => {
  expect(toMatchExpression({
    include: ['files/**/*.gql', 'files2/**/*gql'],
    ignore: ['**/test/**/*.gql'],
  })).toMatchSnapshot();
});
