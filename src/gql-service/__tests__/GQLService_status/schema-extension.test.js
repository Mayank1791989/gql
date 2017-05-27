/* @flow */
/* eslint-disable max-len */
import { status } from './utils';

describe('ObjectTypeExtension', () => {
  it('can extend object type', async () => {
    const errors = await status({
      'schema/test.graphql': `
        type Query {
          name: String!
        }

        extend type Query {
          age: Int!
        }
      `,
    });
    expect(errors).toEqual([]);
  });

  it('report if extending wrong type', async () => {
    const errors = await status({
      'schema/test.graphql': `
        type Query {
          name: String!
        }

        scalar Test

        extend type Test {
          age: Int!
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  it('report if field already present in type', async () => {
    const errors = await status({
      'schema/test.graphql': `
        type Query {
          name: String!
        }

        extend type Query {
          name: Int!
        }
      `,
    });
    expect(errors).toMatchSnapshot();
  });

  it('extend should work if type defined after', async () => {
    const errors = await status({
      'schema/test.graphql': `
        extend type Query {
          age: Int!
        }

        type Query {
          name: String!
        }
      `,
    });
    expect(errors).toEqual([]);
  });
});
