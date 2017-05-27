/* @flow */
import { parse } from 'graphql';
import buildASTSchema from '../buildASTSchema';

test('report multiple schema definition', () => {
  const { errors } = buildASTSchema(
    parse(`
      type Query {
        id: String!
      }
      schema {
        query: Query
      }
      schema {
        query: Query
      }
    `),
  );

  expect(errors).toMatchSnapshot();
});

test('report multiple type definition', () => {
  const { errors } = buildASTSchema(
    parse(`
      type Query {
        id: String!
      }
      schema {
        query: Query
      }

      type Query {
        id: Int!
      }
    `),
  );

  expect(errors).toMatchSnapshot();
});

test('report multiple directive definition', () => {
  const { errors } = buildASTSchema(
    parse(`
      type Query {
        id: String!
      }
      schema {
        query: Query
      }

      directive @test on FIELD
      directive @test on FIELD_DEFINITION
    `),
  );

  expect(errors).toMatchSnapshot();
});

describe('unknown types', () => {
  it('output field type unknown', () => {
    const { errors } = buildASTSchema(
      parse(`
        type Query {
          id: xString!
        }
        schema {
          query: Query
        }
      `),
    );

    expect(errors).toMatchSnapshot();
  });

  it('output field type unknown', () => {
    const { errors } = buildASTSchema(
      parse(`
        type Query {
          id: String!
        }
        schema {
          query: Query
        }

        input SomeInput {
          value: xValue!
        }
      `),
    );

    expect(errors).toMatchSnapshot();
  });

  it('interface type unknown', () => {
    const { errors } = buildASTSchema(
      parse(`
        type Query implements xNode {
          id: String!
        }
        schema {
          query: Query
        }
      `),
    );

    expect(errors).toMatchSnapshot();
  });

  it('union type unknown', () => {
    const { errors } = buildASTSchema(
      parse(`
        type Query {
          id: String!
        }
        schema {
          query: Query
        }

        union Test = Query | xQuery
      `),
    );

    expect(errors).toMatchSnapshot();
  });
});

describe('supports type extension', () => {
  it('report if extending unknown type', () => {
    const { errors } = buildASTSchema(
      parse(`
        type Query {
          id: String!
        }
        schema {
          query: Query
        }

        extend type xTest {
          name: String!
        }

        extend interface xNode {
          name: String!
        }
      `),
    );
    expect(errors).toMatchSnapshot();
  });

  it('reports unsupported type extensions', () => {
    const { errors } = buildASTSchema(
      parse(`
        type Query {
          id: String!
        }
        schema {
          query: Query
        }
        directive @test on SCALAR | UNION

        scalar Test
        extend scalar Test @test

        union UnionTest = Query | String
        extend union UnionTest @test

        enum EnumTest { x, y, z }
        extend enum EnumTest @test

        input InputTest {
          id: String!
        }
        extend input InputTest {
          name: String!
        }
      `),
    );
    expect(errors).toMatchSnapshot();
  });
});
