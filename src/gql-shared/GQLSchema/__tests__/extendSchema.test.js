/* @flow */
import { parse } from 'graphql';
import { getSchema } from 'gql-test-utils/test-data';
import extendSchema from '../extendSchema';

test('report if type already exists in original schema', async () => {
  const { extendSchemaErrors } = await runExtendSchema(`
    type Player {
      someNewField: String!
    }
  `);
  expect(extendSchemaErrors).toMatchSnapshot();
});

describe('object type', () => {
  test('should able to extend object types', async () => {
    const { schema, extendSchemaErrors } = await runExtendSchema(`
      extend type Player {
        test: String!
      }
    `);
    expect(schema.getType('Player').getFields()).toMatchSnapshot();
    expect(extendSchemaErrors).toEqual([]);
  });

  test('should able to extend same type multiple times', async () => {
    const { schema, extendSchemaErrors } = await runExtendSchema(`
      extend type Player {
        test: String!
      }

      extend type Player {
        test2: Int!
      }
    `);
    expect(schema.getType('Player').getFields()).toMatchSnapshot();
    expect(extendSchemaErrors).toEqual([]);
  });

  test('report field already present in original type', async () => {
    const { schema, extendSchemaErrors } = await runExtendSchema(`
      extend type Player {
        id: ID!
      }
    `);
    expect(schema.getType('Player').getFields()).toMatchSnapshot();
    expect(extendSchemaErrors).toMatchSnapshot();
  });

  test('should able to extend type with fields using unknown types', async () => {
    const { schema, extendSchemaErrors } = await runExtendSchema(`
      extend type Player {
        test: xString!
      }
    `);
    expect(schema.getType('Player').getFields()).toMatchSnapshot();
    expect(extendSchemaErrors).toMatchSnapshot();
  });

  test('report if extend type not present in schema', async () => {
    const { extendSchemaErrors } = await runExtendSchema(`
      extend type SomeUnknownType {
        id: String!
      }
    `);
    expect(extendSchemaErrors).toMatchSnapshot();
  });

  test('report if using object_type_extension to extend non object type', async () => {
    const { extendSchemaErrors } = await runExtendSchema(`
      extend type Node {
        test: String!
      }
    `);
    expect(extendSchemaErrors).toMatchSnapshot();
  });

  test('include extension in type dependency', async () => {
    const { schema } = await runExtendSchema(`
      extend type Player {
        test: String!
      }
    `);

    expect(schema.getTypeDependents('Player')).toMatchSnapshot();
  });
});

describe('interface', () => {
  test('should able to extend interface types', async () => {
    const { schema, extendSchemaErrors } = await runExtendSchema(`
      extend interface Node {
        name: String!
      }
    `);
    expect(schema.getType('Node').getFields()).toMatchSnapshot();
    expect(extendSchemaErrors).toEqual([]);
  });

  test('should able to extend same type multiple times', async () => {
    const { schema, extendSchemaErrors } = await runExtendSchema(`
      extend interface Node {
        name: String!
      }

      extend interface Node {
        age: Int!
      }
    `);
    expect(schema.getType('Node').getFields()).toMatchSnapshot();
    expect(extendSchemaErrors).toEqual([]);
  });

  test('report if field already present in original type', async () => {
    const { schema, extendSchemaErrors } = await runExtendSchema(`
      extend interface Node {
        id: String! # trying to change type of id field
      }
    `);
    expect(schema.getType('Node').getFields()).toMatchSnapshot();
    expect(extendSchemaErrors).toMatchSnapshot();
  });

  test('should able to extend type with fields using unknown types', async () => {
    const { schema, extendSchemaErrors } = await runExtendSchema(`
      extend interface Node {
        name: xString!
      }
    `);
    expect(schema.getType('Node').getFields()).toMatchSnapshot();
    expect(extendSchemaErrors).toMatchSnapshot();
  });

  test('report if extending non interface type', async () => {
    const { extendSchemaErrors } = await runExtendSchema(`
      extend interface Player {
        test: String!
      }
    `);
    expect(extendSchemaErrors).toMatchSnapshot();
  });

  test('include extension in type dependency', async () => {
    const { schema } = await runExtendSchema(`
      extend interface Node {
        test: String!
      }
    `);

    expect(schema.getTypeDependents('Node')).toMatchSnapshot();
  });
});

describe('directive', () => {
  test('can add new directives', async () => {
    const { schema, extendSchemaErrors } = await runExtendSchema(`
      directive @newDirective on FIELD
    `);
    expect(schema.getDirective('newDirective')).toMatchSnapshot();
    expect(extendSchemaErrors).toEqual([]);
  });

  test('report if directive already present in original schema', async () => {
    const { extendSchemaErrors } = await runExtendSchema(`
      directive @customDirective on FIELD
    `);
    expect(extendSchemaErrors).toMatchSnapshot();
  });
});

test('report if unsupported type extension used', async () => {
  const { extendSchemaErrors } = await runExtendSchema(`
    extend scalar CustomScalar @test
    extend union UnionTest @test
    extend enum EnumTest @test
    extend input PlayerCreateInput {
      test: String!
    }
  `);
  expect(extendSchemaErrors).toMatchSnapshot();
});

async function runExtendSchema(extendSchemaSource, options): Promise<*> {
  const testSchema = await getSchema();
  const extendSchemaAST = parse(extendSchemaSource, options);
  return extendSchema(testSchema, extendSchemaAST, options);
}
