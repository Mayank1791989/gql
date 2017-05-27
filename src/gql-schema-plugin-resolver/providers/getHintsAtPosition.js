/* @flow */
import { Source, isScalarType, isObjectType, isEnumType } from 'graphql';
import { isPlaceholderType } from 'gql-shared/GQLSchema';
import { type GQLPosition, type GQLHint } from 'gql-shared/types';
import {
  createHintForType,
  createHintForEnumValue,
  createHintForField,
} from 'gql-shared/hints';
import ResolverContext from '../shared/ResolverContext';
import { isResolverType } from '../shared/language/predicates';

type Params = {
  context: ResolverContext,
  source: Source,
  position: GQLPosition,
};

export default function getHintsAtPosition(
  params: Params,
): $ReadOnlyArray<GQLHint> {
  const { context, source, position } = params;

  const token = context.getParser().getTokenAtPosition(source, position);

  if (!token) {
    return [];
  }

  switch (token.kind) {
    case 'ObjectType': {
      const typeMap = context.getTypeMap();
      return Object.keys(typeMap).reduce((acc, key) => {
        const type = typeMap[key];
        if (!isPlaceholderType(type) && isObjectType(type)) {
          acc.push(createHintForType(type));
        }
        return acc;
      }, []);
    }

    case 'ObjectField': {
      const type = context.getType(token.type);
      if (!type || isPlaceholderType(type)) {
        return [];
      }

      if (isObjectType(type)) {
        const fields = type.getFields();
        return Object.keys(fields).map(key => createHintForField(fields[key]));
      }

      return [];
    }

    case 'Scalar': {
      const typeMap = context.getTypeMap();
      return Object.keys(typeMap).reduce((acc, key) => {
        const type = typeMap[key];
        // @TODO: remove core scalar types
        // How to find core scalar types. Should we use what is in the spec??
        if (!isPlaceholderType(type) && isScalarType(type)) {
          acc.push(createHintForType(type));
        }
        return acc;
      }, []);
    }

    case 'Directive': {
      const directives = context.getDirectives();
      // @TODO: remove core directives
      return directives.map(createHintForType);
    }

    case 'Enum': {
      const typeMap = context.getTypeMap();
      return Object.keys(typeMap).reduce((acc, key) => {
        const type = typeMap[key];
        if (isEnumType(type)) {
          acc.push(createHintForType(type));
        }
        return acc;
      }, []);
    }

    case 'EnumValue': {
      const typeName = token.type;
      const type = context.getType(typeName);
      if (type && isEnumType(type)) {
        const values = type.getValues();
        return values.map(value => createHintForEnumValue(value, type));
      }
      return [];
    }

    case 'Type': {
      const typeMap = context.getTypeMap();
      return Object.keys(typeMap).reduce((acc, key) => {
        const type = typeMap[key];
        if (!isPlaceholderType(type) && isResolverType(type)) {
          acc.push(createHintForType(type));
        }
        return acc;
      }, []);
    }

    case 'Field': {
      const typeName = token.type;
      const type = context.getType(typeName);
      if (!type) {
        return [];
      }

      if (isObjectType(type)) {
        const fields = type.getFields();
        return Object.keys(fields).map(key => createHintForField(fields[key]));
      }

      if (isEnumType(type)) {
        const values = type.getValues();
        return values.map(value => createHintForEnumValue(value, type));
      }

      return [];
    }

    default:
      // eslint-disable-next-line playlyfe/babel-no-unused-expressions
      (token.kind: empty);
      return [];
  }
}
