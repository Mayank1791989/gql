/* @flow */
import watch from '../utils/watch';
import { GQL } from '../GQL';
import path from 'path';

jest.mock('../utils/watch');

describe('autocomplete', () => {
  let gql;

  beforeEach(() => {
    gql = new GQL({ cwd: path.resolve('src/__test-data__/') });
    // $FlowDisableNextLine
    watch.__triggerChange();
  });

  describe('autocomplete for `type`', () => {
    it('show all types for Field', () => {
      const sourceText = `
        type TestType {
          name:   #
        }
      `;
      const position = { line: 3, column: 15 };
      expect(gql.autocomplete(sourceText, position)).toMatchSnapshot();
    });

    it('show all types for Field even after typing few chars', () => {
      const sourceText = `
        type TestType {
          name: S #
        }
      `;
      const position = { line: 3, column: 17 };
      expect(gql.autocomplete(sourceText, position)).toMatchSnapshot();
    });

    it('show all output types for Field if cursor on ! and of the form T!', () => {
      const sourceText = `
        type TestType {
          name: S! #
        }
      `;
      const position = { line: 3, column: 18 /* cursor on ! */ };
      expect(gql.autocomplete(sourceText, position)).toMatchSnapshot();
    });

    it('show all output types for Field if cursor on ] and of type [T]', () => {
      const sourceText = `
        type TestType {
          name: [S] #
        }
      `;
      const position = { line: 3, column: 19 /* cursor on ! */ };
      expect(gql.autocomplete(sourceText, position)).toMatchSnapshot();
    });

    it('show all output types for Field if cursor on ! and of the form [T!]', () => {
      const sourceText = `
        type TestType {
          name: [S!] #
        }
      `;
      const position = { line: 3, column: 19 /* cursor on ! */ };
      expect(gql.autocomplete(sourceText, position)).toMatchSnapshot();
    });

    it('dont show any types for Field if cursor after !', () => {
      const sourceText = `
        type TestType {
          name: S! #
        }
      `;
      const position = { line: 3, column: 19 /* cursor after ! */ };
      expect(gql.autocomplete(sourceText, position)).toEqual([]);
    });

    it('dont show any types for Field if cursor after !', () => {
      const sourceText = `
        type TestType {
          name: S! #
        }
      `;
      const position = { line: 3, column: 19 /* cursor after ! */ };
      expect(gql.autocomplete(sourceText, position)).toEqual([]);
    });

    it('show all types for Field with args', () => {
      const sourceText = `
        type TestType {
          players(first: String!):  #
        }
      `;
      const position = { line: 3, column: 36 };
      expect(gql.autocomplete(sourceText, position)).toMatchSnapshot();
    });

    it('show all types for Field ListType', () => {
      const sourceText = `
        type TestType {
          name: []
        }
      `;
      const position = { line: 3, column: 18 };
      expect(gql.autocomplete(sourceText, position)).toMatchSnapshot();
    });

    it('show only InputType for Field input args ', () => {
      const sourceText = `
        type TestType {
          name(xyz: )
        }
      `;
      const position = { line: 3, column: 20 };
      expect(gql.autocomplete(sourceText, position)).toMatchSnapshot();
    });

    it('show `implements` && `{` after typename', () => {
      const sourceText = `
        type TestType  #
      `;

      const position = { line: 2, column: 23 };
      expect(gql.autocomplete(sourceText, position)).toMatchSnapshot();
    });

    it('show all `GraphQLInterfaceType` types after `implements` keyword', () => {
      const sourceText = `
        type TestType implements  #
      `;
      const position = { line: 2, column: 34 };
      expect(gql.autocomplete(sourceText, position)).toMatchSnapshot();
    });

    it('show all `GraphQLInterfaceType` types after multiple InterfaceTypes', () => {
      const sourceText = `
        type TestType implements Node  #
      `;
      const position = { line: 2, column: 39 };
      expect(gql.autocomplete(sourceText, position)).toMatchSnapshot();
    });
  });

  describe('autocomplete for `input`', () => {
    it('show only InputType for field', () => {
      const sourceText = `
        input TestTypeInput {
          name:    #
        }
      `;
      const position = { line: 3, column: 15 };
      expect(gql.autocomplete(sourceText, position)).toMatchSnapshot();
    });

    it('show only InputType for field of ListType', () => {
      const sourceText = `
        input TestType {
          name: []
        }
      `;
      const position = { line: 3, column: 18 };
      expect(gql.autocomplete(sourceText, position)).toMatchSnapshot();
    });
  });

  describe('autocomplete for `union`', () => {
    it('show only GrahQLObjectType for field', () => {
      const sourceText = `
        union TestUnionType =  #
      `;
      const position = { line: 2, column: 31 };
      expect(gql.autocomplete(sourceText, position)).toMatchSnapshot();
    });

    it('show `|` after Type(unionMember)', () => {
      const sourceText = `
        union TestUnionType =  TestType  #
      `;
      const position = { line: 2, column: 41 };
      expect(gql.autocomplete(sourceText, position)).toMatchSnapshot();
    });

    it('show all GrahQLObjectType after `|`', () => {
      const sourceText = `
        union TestUnionType =  TestType |  #
      `;
      const position = { line: 2, column: 43 };
      expect(gql.autocomplete(sourceText, position)).toMatchSnapshot();
    });
  });
});
