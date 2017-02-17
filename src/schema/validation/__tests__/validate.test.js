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

