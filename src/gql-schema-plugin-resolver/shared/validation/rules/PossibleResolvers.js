/* @flow */
import { type TypeLocalResolverValidationRule } from '../types';

export default function PossibleResolvers(): TypeLocalResolverValidationRule {
  return {
    create(context) {
      return {
        ResolverDocument: {
          enter(node) {
            node.resolvers.forEach(resolverNode => {
              switch (resolverNode.kind) {
                case 'ObjectTypeResolver':
                case 'ScalarTypeResolver': {
                  context.getSchema().getTypes();
                }

                //
                case 'EnumTypeResolver':
                case 'EnumValueResolver':
              }
            });
          },
        },
      };
    },
  };
}
