/* @flow */
import getInfoOfTokenAtPosition from '../getInfoOfTokenAtPosition';
import { getSchema, getAllInfo } from 'gql-test-utils/test-data';
import code from 'gql-test-utils/code';
import { schemaParser } from 'gql-test-utils/parsers';

let schema = null;
beforeAll(async () => {
  schema = await getSchema();
});

const allInfo = getAllInfo();
const getInfo = text => {
  if (!schema) {
    throw new Error('Missing schema.');
  }
  const { sourceText, position } = code(text);
  return getInfoOfTokenAtPosition({
    schema,
    sourceText,
    position,
    parser: schemaParser(),
  });
};

test('field type: ObjectType', () => {
  const info = getInfo(`
    type Test {
      field: Player,
      #--------^
    }
  `);
  expect(info).toEqual(allInfo.PlayerType);
});
