/* @flow */
/* @babel-flow-runtime-enable */
import { type TypeGlobalResolverValidationRule } from '../types';
import { type ResolverNode } from '../../language/ast';
import { GQLResolverError } from '../../error';

import { reify, type Type } from 'flow-runtime';

export default function UniqueResolvers(
  options: mixed,
): TypeGlobalResolverValidationRule {
  const ruleOptions = normalizeOptions(options);

  return {
    isGlobal: true,
    create(context) {
      const knownResolversMap: { [key: string]: Array<ResolverNode> } = {};
      const ignoreMap = createIgnoreMap(ruleOptions.ignore);

      return {
        ResolverDocument: {
          enter(node) {
            node.resolvers.forEach(resolverNode => {
              const fields = getFields(resolverNode);
              if (
                !fields ||
                ignoreMap.type[fields.typeName] ||
                ignoreMap.key[toKey(fields)]
              ) {
                return;
              }
              const key = toKey(fields);
              if (!knownResolversMap[key]) {
                knownResolversMap[key] = [];
              }
              knownResolversMap[key].push(resolverNode);
            });
          },
          leave() {
            Object.keys(knownResolversMap).forEach(key => {
              const resolverNodes = knownResolversMap[key];
              if (resolverNodes.length > 1) {
                context.reportError(
                  new GQLResolverError(
                    duplicateResolverMessage(),
                    resolverNodes,
                  ),
                );
              }
            });
          },
        },
      };
    },
  };
}

export function duplicateResolverMessage(): string {
  return 'Multiple resolvers not allowed.';
}

type Options = {
  ignore: Array<{| typeName: string, fieldName?: string |}>,
};

function normalizeOptions(options: mixed): Options {
  const OptionsType = (reify: Type<?Options>);
  OptionsType.assert(options);
  return {
    ignore: [],
    ...(options: $FixMe),
  };
}

function createIgnoreMap(ignore) {
  const ignoreMap: {
    type: { [string]: boolean },
    key: { [string]: boolean },
  } = { type: {}, key: {} };

  return ignore.reduce((acc, item) => {
    if (!item.fieldName) {
      // ignore all fields of type
      acc.type[item.typeName] = true;
    }
    acc.key[toKey(item)] = true;
    return acc;
  }, ignoreMap);
}

function toKey(item) {
  return item.fieldName ? `${item.typeName}/${item.fieldName}` : item.typeName;
}

function getFields(node: ResolverNode) {
  switch (node.kind) {
    case 'TypeResolver':
    case 'ObjectTypeResolver':
    case 'ResolveTypeResolver':
    case 'ScalarTypeResolver':
    case 'EnumTypeResolver':
    case 'DirectiveResolver':
      return { typeName: node.name.value };
    case 'FieldResolver':
    case 'ObjectFieldResolver':
    case 'EnumValueResolver': {
      return {
        typeName: node.type.value,
        fieldName: node.name.value,
      };
    }
    default:
      return null;
  }
}
