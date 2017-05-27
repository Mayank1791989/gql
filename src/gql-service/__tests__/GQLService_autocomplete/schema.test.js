/* @flow */
import code from 'gql-test-utils/code';
import { autocomplete, allHints } from './utils';

describe('type', () => {
  it('show all types for Field', async () => {
    const hints = await autocomplete({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type TestType {
          name:   #
          #-----^
        }
      `),
    });
    expect(hints).toEqual(allHints.OutputTypes);
  });

  it('show all types for Field even after typing few chars', async () => {
    const hints = await autocomplete({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type TestType {
          name: S  #
          #------^
        }
      `),
    });
    expect(hints).toEqual(allHints.OutputTypes);
  });

  it('show all output types for Field if cursor on ! and of the form T!', async () => {
    const hints = await autocomplete({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type TestType {
          name: S!   ##
          #------^
        }
      `),
    });
    expect(hints).toEqual(allHints.OutputTypes);
  });

  it('show all output types for Field if cursor on ] and of type [T]', async () => {
    const hints = await autocomplete({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type TestType {
          name: [S] #
          #-------^
        }
      `),
    });
    expect(hints).toEqual(allHints.OutputTypes);
  });

  it('show all output types for Field if cursor on ! and of the form [T!]', async () => {
    const hints = await autocomplete({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type TestType {
          name: [S!]
          #-------^
        }
      `),
    });
    expect(hints).toEqual(allHints.OutputTypes);
  });

  it('dont show any types for Field if cursor after !', async () => {
    const hints = await autocomplete({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type TestType {
          name: S!  #
          #--------^
        }
      `),
    });
    expect(hints).toEqual([]);
  });

  it('show all types for Field with args', async () => {
    const hints = await autocomplete({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type TestType {
          players(first: String!):   #
                          #--------^
        }
      `),
    });
    expect(hints).toEqual(allHints.OutputTypes);
  });

  it('show all types for Field ListType', async () => {
    const hints = await autocomplete({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type TestType {
          name: []
          #-----^ (inside bracket)
        }
      `),
    });
    expect(hints).toEqual(allHints.OutputTypes);
  });

  it('show only InputType for Field input args ', async () => {
    const hints = await autocomplete({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type TestType {
          name(xyz: )
          #--------^
        }
      `),
    });
    expect(hints).toEqual(allHints.InputTypes);
  });

  it('show `implements` && `{` after typename', async () => {
    const hints = await autocomplete({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type TestType   #
        #-------------^
      `),
    });
    expect(hints).toMatchInlineSnapshot(`
      Array [
        Object {
          "text": "implements",
          "type": "Implements",
        },
        Object {
          "text": "{",
        },
      ]
    `);
  });

  it('show all `GraphQLInterfaceType` types after `implements` keyword', async () => {
    const hints = await autocomplete({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type TestType implements   # (Dont remove hash will avoid removing space after line)
        #------------------------^
      `),
    });
    expect(hints).toEqual(allHints.InterfaceTypes);
  });

  it('show all `GraphQLInterfaceType` types after multiple InterfaceTypes', async () => {
    const hints = await autocomplete({
      sourcePath: 'schema/test.graphql',
      ...code(`
        type TestType implements Node   #
              #-----------------------^
      `),
    });
    expect(hints).toEqual(allHints.InterfaceTypes);
  });
});

describe('input', () => {
  it('show only InputType for field', async () => {
    const hints = await autocomplete({
      sourcePath: 'schema/test.graphql',
      ...code(`
        input TestTypeInput {
          name:   #
          ------^
        }
      `),
    });
    expect(hints).toEqual(allHints.InputTypes);
  });

  it('show only InputType for field of ListType', async () => {
    const hints = await autocomplete({
      sourcePath: 'schema/test.graphql',
      ...code(`
        input TestType {
          name: []
          ------^ (inside bracket)
        }
      `),
    });
    expect(hints).toEqual(allHints.InputTypes);
  });
});

describe('union', () => {
  it('show only GrahQLObjectType for field', async () => {
    const hints = await autocomplete({
      sourcePath: 'schema/test.graphql',
      ...code(`
        union TestUnionType =   #
            #-----------------^
      `),
    });
    expect(hints).toEqual(allHints.ObjectTypes);
  });

  it('show all GrahQLObjectType after `|`', async () => {
    const hints = await autocomplete({
      sourcePath: 'schema/test.graphql',
      ...code(`
        union TestUnionType =  TestType |   #
                      #-------------------^
      `),
    });
    expect(hints).toEqual(allHints.ObjectTypes);
  });
});
