/* @flow */
import { parse } from 'graphql/language/parser';
import { buildASTSchema } from '../../SchemaBuilder/buildASTSchema';
import { validate } from '../validate';

it('Report unused type definition', () => {
  const ast = parse(`
    type A {
      name: String
    }

    type X {
      value: Int!
    }

    type B {
      name: A
    }
  `);

  const { schema } = buildASTSchema(ast);
  const errors = validate((schema: any), ast);
  expect(errors).toMatchSnapshot();
});

it('Dont report type unused if type implements interface', () => {
  const ast = parse(`
    interface Node {
      id: String!
    }

    type A {
      name: String
    }

    type X implements Node {
      value: Int!
      a: A
    }
  `);

  const { schema } = buildASTSchema(ast);
  const errors = validate((schema: any), ast);
  expect(errors).toEqual([]);
});

it('throw error if rules packages is unknown', () => {
  const ast = parse(`
    type A {
      name: String
    }

    type X {
      value: Int!
    }

    type B {
      name: A
    }
  `);

  const { schema } = buildASTSchema(ast);
  expect(() => {
    validate((schema: any), ast, { extends: 'some_unknown_package' });
  }).toThrowErrorMatchingSnapshot();
});

describe('Directiva validation', () => {
  it('Should report unknown directives', () => {
    const ast = parse(`
    type Query {
      node: String! @some_directive
    }
  `);

    const { schema } = buildASTSchema(ast);
    expect(validate((schema: any), ast)).toMatchSnapshot();
  });

  it('Should report if directive used in wrong location', () => {
    const ast = parse(`
      directive @some_directive on FIELD

      type Query {
        node: String! @some_directive
      }
    `);

    const { schema } = buildASTSchema(ast);
    expect(validate((schema: any), ast)).toMatchSnapshot();
  });

  it('Should report if unknown directive arguments used', () => {
    const ast = parse(`
      directive @some_directive(
        boolArg: Boolean
      ) on FIELD_DEFINITION

      type Query {
        node: String! @some_directive(test: "5")
      }
    `);

    const { schema } = buildASTSchema(ast);
    expect(validate((schema: any), ast)).toMatchSnapshot();
  });

  it('Should report if directive argument type is wrong', () => {
    const ast = parse(`
      directive @some_directive(
        boolArg: Boolean
      ) on FIELD_DEFINITION

      type Query {
        node: String! @some_directive(boolArg: "5")
      }
    `);

    const { schema } = buildASTSchema(ast);
    expect(validate((schema: any), ast)).toMatchSnapshot();
  });

  it('Should report if directive required arguments missing', () => {
    const ast = parse(`
      directive @some_directive(
        boolArg: Boolean
        reqArg: Boolean!
      ) on FIELD_DEFINITION

      type Query {
        node: String! @some_directive(boolArg: true)
      }
    `);

    const { schema } = buildASTSchema(ast);
    expect(validate((schema: any), ast)).toMatchSnapshot();
  });

  it('Should report duplicate arguments', () => {
    const ast = parse(`
      directive @some_directive(
        boolArg: Boolean
        reqArg: Boolean!
      ) on FIELD_DEFINITION

      type Query {
        node: String! @some_directive(boolArg: true, reqArg: true, boolArg: false)
      }
    `);

    const { schema } = buildASTSchema(ast);
    expect(validate((schema: any), ast)).toMatchSnapshot();
  });

  it('Should report if directive used multiple times in same location', () => {
    const ast = parse(`
      directive @some_directive(
        boolArg: Boolean
        reqArg: Boolean!
      ) on FIELD_DEFINITION

      type Query {
        node: String! @some_directive(reqArg: true) @some_directive(reqArg: false, boolArg: true)
      }
    `);

    const { schema } = buildASTSchema(ast);
    expect(validate((schema: any), ast)).toMatchSnapshot();
  });
});
