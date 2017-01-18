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
  const errors = validate(schema, ast);
  expect(errors).toMatchSnapshot();
});
