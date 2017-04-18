/* @flow */
import { getSchema } from '../../../__test-data__/utils';
import parseQuery from '../../_shared/parseQuery';
import { Source } from 'graphql/language/source';
import validate from '../validate';
import invariant from 'invariant';

function validateSource(source: string) {
  const schema = getSchema();
  const { ast } = parseQuery(new Source(source), {
    isRelay: true,
    parser: ['EmbeddedQueryParser', { startTag: 'Relay\\.QL`', endTag: '`' }],
  });
  invariant(ast, '[unexpected error] ast should be defined here');
  return validate(schema, ast, { isRelay: true });
}

describe('Rule: ScalarLeafs', () => {
  it('report error for missing subselection in fragments', () => {
    const errors = validateSource(`
      Relay.QL\`
        fragment on Viewer {
          me
        }
      \`
    `);
    expect(errors).toMatchSnapshot();
  });

  it('allow field without subselection in fragments if @relay(pattern: true) is present', () => {
    const errors = validateSource(`
      Relay.QL\`
        fragment on PlayerCreatePayload @relay(pattern: true) {
          player
        }
      \`
    `);
    expect(errors).toMatchSnapshot();
  });

  it('allow query without subselection', () => {
    const errors = validateSource(`
      Relay.QL\`
        query { viewer }
      \`
    `);
    expect(errors).toMatchSnapshot();
  });

  it('allow mutation without subselection', () => {
    const errors = validateSource(`
      Relay.QL\`
        mutation { PlayerCreate }
      \`
    `);
    expect(errors).toMatchSnapshot();
  });
});

describe('Rule: ArgumentsOfCorrectType', () => {
  it('report error for wrong type', () => {
    const errors = validateSource(`
      Relay.QL\`
        fragment on Player {
          image(size: "some_string_value")
        }
      \`
    `);
    expect(errors).toMatchSnapshot();
  });
});

describe('Rule: ProvidedNonNullArguments', () => {
  it('report error if field arguments missing', () => {
    const errors = validateSource(`
      Relay.QL\`
        fragment on Player {
          image
        }
      \`
    `);
    expect(errors).toMatchSnapshot();
  });

  it('allow mutation field without arguments', () => {
    const errors = validateSource(`
      Relay.QL\`
        mutation { PlayerCreate }
      \`
    `);
    expect(errors).toMatchSnapshot();
  });
});

test('should not report errors for valid query', () => {
  const errors = validateSource(`
    Relay.QL\`
      fragment on Player {
        name
        id
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});
