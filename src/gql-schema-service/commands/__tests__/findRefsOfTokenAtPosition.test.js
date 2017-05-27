/* @flow */
import findRefsOfTokenAtPosition from '../findRefsOfTokenAtPosition';

import { getAllRefs, getSchema, sortRefs } from 'gql-test-utils/test-data';
import code from 'gql-test-utils/code';
import { schemaParser } from 'gql-test-utils/parsers';
import { GQLSchema } from 'gql-shared/GQLSchema';

const refLocations = getAllRefs();
let schema: ?GQLSchema = null;
beforeAll(async () => {
  schema = await getSchema();
});

const findRefs = (sourceText, position) => {
  if (!schema) {
    throw new Error('Missing schema');
  }
  return findRefsOfTokenAtPosition({
    schema,
    sourceText,
    position,
    parser: schemaParser(),
  }).sort(sortRefs);
};

test('field type: ObjectType', () => {
  const { sourceText, position } = code(`
    type Test {
      field: Player,
      #--------^
    }
  `);
  expect(findRefs(sourceText, position)).toEqual(refLocations.Player);
});
