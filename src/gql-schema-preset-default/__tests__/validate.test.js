/* @flow */
import { createTempFiles } from 'gql-test-utils/file';
import { dedent } from 'dentist';
import GQLService from 'gql-service';

describe('Directiva validation', () => {
  it('Should report unknown directives', async () => {
    const errors = await validateSource(`
      type Query {
        node: String! @some_directive
      }
    `);

    expect(errors).toMatchSnapshot();
  });

  it('Should report if directive used in wrong location', async () => {
    const errors = await validateSource(`
      directive @some_directive on FIELD
      type Query {
        node: String! @some_directive
      }
    `);
    expect(errors).toMatchSnapshot();
  });

  it('Should report if unknown directive arguments used', async () => {
    const errors = await validateSource(`
      directive @some_directive(
        boolArg: Boolean
      ) on FIELD_DEFINITION
      type Query {
        node: String! @some_directive(test: "5")
      }
    `);
    expect(errors).toMatchSnapshot();
  });

  it('Should report if directive argument type is wrong', async () => {
    const errors = await validateSource(`
      directive @some_directive(
        boolArg: Boolean
      ) on FIELD_DEFINITION
      type Query {
        node: String! @some_directive(boolArg: "5")
      }
    `);

    expect(errors).toMatchSnapshot();
  });

  it('Should report if directive required arguments missing', async () => {
    const errors = await validateSource(`
      directive @some_directive(
        boolArg: Boolean
        reqArg: Boolean!
      ) on FIELD_DEFINITION
      type Query {
        node: String! @some_directive(boolArg: true)
      }
    `);

    expect(errors).toMatchSnapshot();
  });

  it('Should report duplicate arguments', async () => {
    const errors = await validateSource(`
      directive @some_directive(
        boolArg: Boolean
        reqArg: Boolean!
      ) on FIELD_DEFINITION
      type Query {
        node: String! @some_directive(boolArg: true, reqArg: true, boolArg: false)
      }
    `);

    expect(errors).toMatchSnapshot();
  });

  it('Should report if directive used multiple times in same location', async () => {
    const errors = await validateSource(`
      directive @some_directive(
        boolArg: Boolean
        reqArg: Boolean!
      ) on FIELD_DEFINITION
      type Query {
        node: String! @some_directive(reqArg: true) @some_directive(reqArg: false, boolArg: true)
      }
    `);

    expect(errors).toMatchSnapshot();
  });
});

async function validateSource(
  source: string,
  opts: { otherFiles?: Object } = {},
): Promise<any> {
  const gql = new GQLService({
    configDir: createTempFiles({
      '.gqlconfig': JSON.stringify({
        schema: {
          files: 'schema/*.graphql',
        },
      }),
      'schema/main.graphql': dedent(source),
      ...opts.otherFiles,
    }),

    watch: false,
  });

  gql.onError(err => {
    throw err;
  });

  await gql.start();

  return gql.status();
}
