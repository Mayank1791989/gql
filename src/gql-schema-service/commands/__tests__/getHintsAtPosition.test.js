/* @flow */
import getHintsAtPosition from '../getHintsAtPosition';
import { getSchema, getHints, sortHints } from 'gql-test-utils/test-data';
import code from 'gql-test-utils/code';
import { schemaParser } from 'gql-test-utils/parsers';

const allHints = getHints();

const getHintsAt = async (text: string) => {
  const { sourceText, position } = code(text);
  const schema = await getSchema();
  return getHintsAtPosition({
    schema,
    sourceText,
    position,
    parser: schemaParser(),
  }).sort(sortHints);
};

// NOTE: other tests in gql-service/test
it('works', async () => {
  const hints = await getHintsAt(`
    type TestType {
      name:   #
      #-----^
    }
  `);
  expect(hints).toEqual(allHints.OutputTypes);
});
