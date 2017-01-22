/* @flow */
import { getHintsAtPosition } from '../index';
import { getSchema, getHints, code } from '../../../__test-data__/utils';

const schema = getSchema();
const allHints = getHints();
const getHintsAt = (text) => {
  const { sourceText, position } = code(text);
  return getHintsAtPosition(schema, sourceText, position);
};

describe('autocomplete for `type`', () => {
  it('show all types for Field', () => {
    const hints = getHintsAt(`
      type TestType {
        name:   #
        #-----^
      }
    `);
    expect(hints).toEqual(allHints.OutputTypes);
  });

  it('show all types for Field even after typing few chars', () => {
    const hints = getHintsAt(`
      type TestType {
        name: S  #
        #------^
      }
    `);
    expect(hints).toEqual(allHints.OutputTypes);
  });

  it('show all output types for Field if cursor on ! and of the form T!', () => {
    const hints = getHintsAt(`
      type TestType {
        name: S!   ##
        #-------^
      }
    `);
    expect(hints).toEqual(allHints.OutputTypes);
  });

  it('show all output types for Field if cursor on ] and of type [T]', () => {
    const hints = getHintsAt(`
      type TestType {
        name: [S] #
        #-------^
      }
    `);
    expect(hints).toEqual(allHints.OutputTypes);
  });

  it('show all output types for Field if cursor on ! and of the form [T!]', () => {
    const hints = getHintsAt(`
      type TestType {
        name: [S!]
        #-------^
      }
    `);
    expect(hints).toEqual(allHints.OutputTypes);
  });

  it('dont show any types for Field if cursor after !', () => {
    const hints = getHintsAt(`
      type TestType {
        name: S!  #
        #--------^
      }
    `);
    expect(hints).toEqual([]);
  });

  it('show all types for Field with args', () => {
    const hints = getHintsAt(`
      type TestType {
        players(first: String!):   #
                        #--------^
      }
    `);
    expect(hints).toEqual(allHints.OutputTypes);
  });

  it('show all types for Field ListType', () => {
    const hints = getHintsAt(`
      type TestType {
        name: []
        #-----^ (inside bracket)
      }
    `);
    expect(hints).toEqual(allHints.OutputTypes);
  });

  it('show only InputType for Field input args ', () => {
    const hints = getHintsAt(`
      type TestType {
        name(xyz: )
        #--------^
      }
    `);
    expect(hints).toEqual(allHints.InputTypes);
  });

  it('show `implements` && `{` after typename', () => {
    const hints = getHintsAt(`
      type TestType   #
      #-------------^
    `);

    expect(hints).toMatchSnapshot();
  });

  it('show all `GraphQLInterfaceType` types after `implements` keyword', () => {
    const hints = getHintsAt(`
      type TestType implements   # (Dont remote hash will avoid removing space after line)
      #------------------------^
    `);
    expect(hints).toEqual(allHints.InterfaceTypes);
  });

  it('show all `GraphQLInterfaceType` types after multiple InterfaceTypes', () => {
    const hints = getHintsAt(`
      type TestType implements Node   #
            #-----------------------^
    `);
    expect(hints).toEqual(allHints.InterfaceTypes);
  });
});

describe('autocomplete for `input`', () => {
  it('show only InputType for field', () => {
    const hints = getHintsAt(`
      input TestTypeInput {
        name:   #
        ------^
      }
    `);
    expect(hints).toEqual(allHints.InputTypes);
  });

  it('show only InputType for field of ListType', () => {
    const hints = getHintsAt(`
      input TestType {
        name: []
        ------^ (inside bracket)
      }
    `);
    expect(hints).toEqual(allHints.InputTypes);
  });
});

describe('autocomplete for `union`', () => {
  it('show only GrahQLObjectType for field', () => {
    const hints = getHintsAt(`
      union TestUnionType =   #
          #-----------------^
    `);
    expect(hints).toEqual(allHints.ObjectTypes);
  });

  it('show all GrahQLObjectType after `|`', () => {
    const hints = getHintsAt(`
      union TestUnionType =  TestType |   #
                    #-------------------^
    `);
    expect(hints).toEqual(allHints.ObjectTypes);
  });
});
