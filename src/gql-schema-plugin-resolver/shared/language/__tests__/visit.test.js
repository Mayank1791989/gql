/* @flow */
import { Source } from 'graphql';
import TestResolverParser from '../../test-utils/TestResolverParser';
import { visit } from '../visitor';

const Parser = TestResolverParser();

test('visit', () => {
  const parser = Parser.create();
  const ast = parser.parse(
    new Source(
      `
      resolvers[Test/id] = func;
      resolvers[Test/name] = func;
      scalars[Test] = func;
    `,
      'test.js',
    ),
  );

  console.log(ast);

  visit(ast, {
    enter(node, key, parent, path) {
      console.log('enter', { node, key, parent, path });
    },
    leave(node, key, parent, path) {
      console.log('leave', { node, key, parent, path });
    },
  });
});
