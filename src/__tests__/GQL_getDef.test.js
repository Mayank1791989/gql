/* @flow */
import watch from '../utils/watch';
import { GQL } from '../GQL';
import path from 'path';

jest.mock('../utils/watch');

describe('getDef', () => {
  let gql;
  let defLocations;

  beforeEach(() => {
    gql = new GQL({ cwd: path.resolve('src/__test-data__/') });
    // $FlowDisableNextLine
    watch.__triggerChange();

    defLocations = {
      Player: {
        start: { line: 12, column: 1 },
        end: { line: 15, column: 1 },
        path: path.resolve('src/__test-data__/schema/query.gql'),
      },
      Team: {
        start: { line: 17, column: 1 },
        end: { line: 20, column: 1 },
        path: path.resolve('src/__test-data__/schema/query.gql'),
      },
      Node: {
        start: { line: 8, column: 1 },
        end: { line: 10, column: 1 },
        path: path.resolve('src/__test-data__/schema/query.gql'),
      },
      Edge: {
        start: { line: 27, column: 1 },
        end: { line: 30, column: 1 },
        path: path.resolve('src/__test-data__/schema/query.gql'),
      },
      PlayerCreateInput: {
        start: { line: 6, column: 1 },
        end: { line: 9, column: 1 },
        path: path.resolve('src/__test-data__/schema/mutation.gql'),
      },
    };
  });

  describe('getDef for `type`', () => {
    it('Field Type', () => {
      const sourceText = `
        type TestType {
          player: Player
        }
      `;
      const position = { line: 3, column: 21 };
      expect(gql.getDef(sourceText, position)).toEqual(defLocations.Player);
    });

    it('Field Type inside ListType', () => {
      const sourceText = `
        type TestType {
          players: [Player]
        }
      `;
      const position = { line: 3, column: 23 };
      expect(gql.getDef(sourceText, position)).toEqual(defLocations.Player);
    });

    it('Field args type', () => {
      const sourceText = `
        type TestType {
          players(player: PlayerCreateInput!):  #
        }
      `;
      const position = { line: 3, column: 28 };
      expect(gql.getDef(sourceText, position)).toEqual(defLocations.PlayerCreateInput);
    });

    it('Field with args: Type', () => {
      const sourceText = `
        type TestType {
          players(first: String!): Player
        }
      `;
      const position = { line: 3, column: 37 };
      expect(gql.getDef(sourceText, position)).toEqual(defLocations.Player);
    });

    it('Types after implements 2', () => {
      const sourceText = `
        type TestType implements Node, Edge
      `;
      const position = { line: 2, column: 34 };
      const position2 = { line: 2, column: 40 };

      expect(gql.getDef(sourceText, position)).toEqual(defLocations.Node);
      expect(gql.getDef(sourceText, position2)).toEqual(defLocations.Edge);
    });
  });

  describe('getDef for `input`', () => {
    it('Field Type', () => {
      const sourceText = `
        input TestTypeInput {
          player: PlayerCreateInput!
        }
      `;
      const position = { line: 3, column: 28 };
      expect(gql.getDef(sourceText, position)).toEqual(defLocations.PlayerCreateInput);
    });

    it('Field list Type', () => {
      const sourceText = `
        input TestType {
          name: [PlayerCreateInput!]
        }
      `;
      const position = { line: 3, column: 30 };
      expect(gql.getDef(sourceText, position)).toEqual(defLocations.PlayerCreateInput);
    });
  });

  describe('getDef for `union`', () => {
    it('All Type UnionMembers', () => {
      const sourceText = `
        union TestUnionType = Player | Team
      `;
      const position = { line: 2, column: 33 };
      const position2 = { line: 2, column: 42 };
      expect(gql.getDef(sourceText, position)).toEqual(defLocations.Player);
      expect(gql.getDef(sourceText, position2)).toEqual(defLocations.Team);
    });
  });

  it('should return undefined for graphql core types', () => {
    const sourceText = `
      type TestType {
        name: String
      }
    `;
    const position = { line: 3, column: 17 };
    expect(gql.getDef(sourceText, position)).toBeUndefined();
  });
});
