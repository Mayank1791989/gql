/* @flow */
import { GraphQLError } from 'graphql/error';
import { unknownTypeMessage } from 'graphql/validation/rules/KnownTypeNames';
import suggestionList from '../../utils/suggestionList';

export function KnownTypeNames(context: any) {
  return {
    NamedType(node: Object) {
      const schema = context.getSchema();
      const typeName = node.name.value;
      const type = schema.getType(typeName);
      if (!type) {
        console.time('suggestions');
        const suggestions = suggestionList(typeName, Object.keys(schema.getTypeMap()));
        console.timeEnd('suggestions');
        context.reportError(new GraphQLError(
          unknownTypeMessage(
            typeName,
            suggestions,
          ),
          [node],
        ));
      }
    },
  };
}
