/* @flow */
import { parse, getDescription } from 'graphql';
import { printASTNode } from '../index';

function print(text: string, commentDescriptions: boolean) {
  const astNode = parse(text);
  const [node] = astNode.definitions;
  return printASTNode(node, getDescription(node, { commentDescriptions }), {
    commentDescriptions,
  });
}

describe('old style Descriptions', () => {
  it('commentDescription: true', () => {
    expect(
      print(
        `
        # old style comment description
        type Test { id: string }
      `,
        true,
      ),
    ).toMatchSnapshot();
  });

  it('commentDescription: false', () => {
    expect(
      print(
        `
        # old style comment description
        type Test { id: string }
      `,
        false,
      ),
    ).toMatchSnapshot();
  });
});

describe('new style Descriptions', () => {
  it('commentDescription: true', () => {
    expect(
      print(
        `
        " new style comment "
        type Test { id: string }
      `,
        true,
      ),
    ).toMatchSnapshot();
  });

  it('commentDescription: false', () => {
    expect(
      print(
        `
        "new style comment"
        type Test { id: string }
      `,
        false,
      ),
    ).toMatchSnapshot();
  });
});
