/* @flow */
import parseFileMatchConfig from '../parseFileMatchConfig';

test('string', () => {
  expect(parseFileMatchConfig('files/**/*.gql')).toMatchInlineSnapshot(`
Object {
  "glob": "files/**/*.gql",
  "ignored": Array [],
}
`);
});

test('Array<string>', () => {
  expect(parseFileMatchConfig(['files/**/*.gql', 'files2/**/*.gql']))
    .toMatchInlineSnapshot(`
Object {
  "glob": Array [
    "files/**/*.gql",
    "files2/**/*.gql",
  ],
  "ignored": Array [],
}
`);
});

test('Object<include: string>', () => {
  expect(
    parseFileMatchConfig({
      include: 'files/**/*.gql',
    }),
  ).toMatchInlineSnapshot(`
Object {
  "glob": "files/**/*.gql",
  "ignored": Array [],
}
`);
});

test('Object<include: Array<string>>: single', () => {
  expect(
    parseFileMatchConfig({
      include: ['files/**/*.gql'],
    }),
  ).toMatchInlineSnapshot(`
Object {
  "glob": Array [
    "files/**/*.gql",
  ],
  "ignored": Array [],
}
`);
});

test('Object<match: Array<string>>', () => {
  expect(
    parseFileMatchConfig({
      include: ['files/**/*.gql', 'files2/**/*gql'],
    }),
  ).toMatchInlineSnapshot(`
Object {
  "glob": Array [
    "files/**/*.gql",
    "files2/**/*gql",
  ],
  "ignored": Array [],
}
`);
});

test('Object<include: Array<string>, ignore: string>', () => {
  expect(
    parseFileMatchConfig({
      include: ['files/**/*.gql', 'files2/**/*gql'],
      ignore: '**/test/**/*.gql',
    }),
  ).toMatchInlineSnapshot(`
Object {
  "glob": Array [
    "files/**/*.gql",
    "files2/**/*gql",
  ],
  "ignored": "**/test/**/*.gql",
}
`);
});

test('Object<match: Array<string>, ignore: Array<string>>', () => {
  expect(
    parseFileMatchConfig({
      include: ['files/**/*.gql', 'files2/**/*gql'],
      ignore: ['**/test/**/*.gql'],
    }),
  ).toMatchInlineSnapshot(`
Object {
  "glob": Array [
    "files/**/*.gql",
    "files2/**/*gql",
  ],
  "ignored": Array [
    "**/test/**/*.gql",
  ],
}
`);
});
