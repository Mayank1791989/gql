/* @flow */
import { GQL } from '../GQL';
import fs from 'fs';
import watch from '../utils/watch';

jest.mock('../utils/watch', () => {
  const _watch = (rootPath, patter, callback) => {
    // $FlowDisableNextLine
    watch.__onChangeCallback = callback;
  };
  _watch.__triggerUpdate = (files) => {
    _watch.__onChangeCallback(Object.keys(files).map(name => ({ name, exists: true })));
  };
  return _watch;
});
jest.mock('../utils/loadConfig', () => (
  options => ({
    schema: { files: `${options.cwd}/**/*.gql` },
    dir: '',
  })
));
jest.mock('fs');

function runGQL(files): GQL {
  // $FlowDisableNextLine
  fs.__setMockFiles(files);
  const gql = new GQL({ cwd: 'schema' });
  // $FlowDisableNextLine
  watch.__triggerUpdate(files);
  return gql;
}

describe('Global Schema errors', () => {
  it('should report error when `Query` type is missing', () => {
    expect(runGQL({
      'test.gql': 'type Test { name: String }',
    }).status()).toMatchSnapshot();
  });
});

describe('Wrong type', () => {
  it('not report error if ObjectType field is of Output(scalar|object|enum|scalar|union) type', () => {
    expect(runGQL({
      'schema.gql': `
        type ObjectType { name: String }
        interface InterfaceType { name: String }
        enum EnumType { name }
        scalar ScalarType
        union UnionType = ObjectType
        type Query {
          test: ObjectType,
          test2: InterfaceType,
          test3: EnumType,
          test4: ScalarType,
          test5: UnionType,
        }
      `,
    }).status()).toEqual([]);
  });

  it('report error if ObjectType field is of InputObject type', () => {
    expect(runGQL({
      'schema.gql': `
        input Test { name: String }
        type Query { test: Test }
      `,
    }).status()).toMatchSnapshot();
  });

  it('not report error if ObjectType field args is of InputObject type', () => {
    expect(runGQL({
      'schema.gql': `
        scalar ScalarType
        enum EnumType { name }
        input InputObjectType { name: String }
        type Query {
          test(
            scalarArg: ScalarType
            enumArg: EnumType
            inputObjectArg: InputObjectType
          ): String
        }
      `,
    }).status()).toEqual([]);
  });

  it('report error if ObjectType field args is of ObjectType', () => {
    expect(runGQL({
      'schema.gql': `
        type ObjectType { name: String }
        type Query {
          test(arg1: ObjectType): String
        }
      `,
    }).status()).toMatchSnapshot();
  });

  it('report error if ObjectType field args is of UnionType', () => {
    expect(runGQL({
      'schema.gql': `
        type ObjectType { name: String }
        union UnionType = ObjectType
        type Query {
          test(arg1: UnionType): String
        }
      `,
    }).status()).toMatchSnapshot();
  });

  it('report error if ObjectType field args is of InterfaceType', () => {
    expect(runGQL({
      'schema.gql': `
        interface InterfaceType { name: String }
        type Query {
          test(arg1: InterfaceType): String
        }
      `,
    }).status()).toMatchSnapshot();
  });
});

describe('Multiple definition for same type', () => {
  it('should report for same type (ObjectType)', () => {
    expect(runGQL({
      'schema.gql': `
        type Query { name: String }
        type Test { name: String }
        type Test { name: String }
      `,
    }).status()).toMatchSnapshot();
  });

  it('should report for different type (ObjectType and InputType)', () => {
    expect(runGQL({
      'schema.gql': `
        type Query { name: String }
        type Test { name: String }
        input Test { name: String }
      `,
    }).status()).toMatchSnapshot();
  });

  it('should report for different type (Object and Scalar)', () => {
    expect(runGQL({
      'schema.gql': `
        type Query { name: String }
        type Test { name: String }
        scalar Test
      `,
    }).status()).toMatchSnapshot();
  });

  it('should report for input type (Input and Scalar)', () => {
    expect(runGQL({
      'schema.gql': `
        type Query { name: String }
        input Test { name: String }
        scalar Test
      `,
    }).status()).toMatchSnapshot();
  });

  it('should report if same named types in different files', () => {
    expect(runGQL({
      'file1.gql': `
        type Query { name: String }
        input Test { name: String }
      `,
      'file2.gql': `
        scalar Test
      `,
    }).status()).toMatchSnapshot();
  });
});

describe('Unknown Type Name', () => {
  it('detect in fieldDef of output type', () => {
    expect(runGQL({
      'schema.gql': `
        type Query { name: Test }
        type Test {
          name: XTest
        }
      `,
    }).status()).toMatchSnapshot();
  });

  it('detect in fieldDef of input type', () => {
    expect(runGQL({
      'schema.gql': `
        type Query { name(arg: Test): String }
        input Test {
          name: XTest
        }
      `,
    }).status()).toMatchSnapshot();
  });

  it('detect in fieldDef of interface type', () => {
    expect(runGQL({
      'schema.gql': `
        type Query { name: Test }
        interface Test {
          name: XTest
        }
      `,
    }).status()).toMatchSnapshot();
  });

  it('detect when type is used in union type', () => {
    expect(runGQL({
      'schema.gql': `
        type Query { name: Test }
        union Test = xTest
      `,
    }).status()).toMatchSnapshot();
  });

  it('detect when type is non-nullable', () => {
    expect(runGQL({
      'schema.gql': `
        type Query { name: Test }
        type Test {
          name: XTest!
        }
      `,
    }).status()).toMatchSnapshot();
  });

  it('detect when type is inside list', () => {
    expect(runGQL({
      'schema.gql': `
        type Query { name: Test }
        type Test {
          name: [XTest]
        }
      `,
    }).status()).toMatchSnapshot();
  });

  it('detect in args', () => {
    expect(runGQL({
      'schema.gql': `
        type Query { name: Test }
        type Test {
          name(first: xString): String
        }
      `,
    }).status()).toMatchSnapshot();
  });
});

it('should not include file name and location in Syntax error', () => {
  expect(runGQL({
    'query.gql': `
      type Query { name: String }
    `,
    'schema.gql': `
      input Test implements
    `,
  }).status()).toMatchSnapshot();
});

describe('Check interface correctly implemented', () => {
  it('report error when fields missing', () => {
    expect(runGQL({
      'schema.gql': `
        type Query { name: Test }
        interface Node {
          id: ID!
        }
        type Test implements Node {
          name: String
        }
      `,
    }).status()).toMatchSnapshot();
  });

  it('dont report wrong implementation error when implemented type is not found', () => {
    // NOTE: if type not found it is replaced with placeholder type
    expect(runGQL({
      'schema.gql': `
        type Query { name: Test }
        type Test implements Nodes {
          name: String
        }
      `,
    }).status()).toMatchSnapshot();
  });

  it('report error when field type mismatch', () => {
    expect(runGQL({
      'schema.gql': `
        type Query { name: Test }
        interface Node {
          id: ID!
        }
        type Test implements Node {
          id: ID
          name: String
        }
      `,
    }).status()).toMatchSnapshot();
  });

  it('report error when field args missing', () => {
    expect(runGQL({
      'schema.gql': `
        type Query { name: Test }
        interface Node {
          list(first: String!, after: String!): [ID]!
        }
        type Test implements Node {
          list(first: String!): [ID]!
          name: String
        }
      `,
    }).status()).toMatchSnapshot();
  });

  it('report error when field args type mismatch', () => {
    expect(runGQL({
      'schema.gql': `
        type Query { name: Test }
        interface Node {
          list(first: String!): [ID]!
        }
        type Test implements Node {
          list(first: Int!): [ID]!
          name: String
        }
      `,
    }).status()).toMatchSnapshot();
  });

  it('report error when additional arguments are required', () => {
    expect(runGQL({
      'schema.gql': `
        type Query { name: Test }
        interface Node {
          list(first: String!): [ID]!
        }
        type Test implements Node {
          list(first: String!, second: Int!): [ID]!
          name: String
        }
      `,
    }).status()).toMatchSnapshot();
  });
});
