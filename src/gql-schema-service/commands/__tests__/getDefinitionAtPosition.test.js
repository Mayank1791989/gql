/* @flow */
import getDefinitionAtPosition from '../getDefinitionAtPosition';
import { getDefLocations, getSchema } from 'gql-test-utils/test-data';
import code from 'gql-test-utils/code';
import { schemaParser } from 'gql-test-utils/parsers';

const defLocations = getDefLocations();
let schema = null;
beforeAll(async () => {
  schema = await getSchema();
});

const getDef = text => {
  if (!schema) {
    throw new Error('Missing schema.');
  }
  const { sourceText, position } = code(text);
  return getDefinitionAtPosition({
    schema,
    sourceText,
    position,
    parser: schemaParser(),
  });
};

test('field type: ObjectType', () => {
  const def = getDef(`
    type Test {
      field: Player,
        #------^
    }
  `);
  expect(def).toEqual(defLocations.Player);
});
