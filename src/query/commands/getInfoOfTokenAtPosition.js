/* @flow */
import { type Position, type GQLInfo } from '../../shared/types';
import { getNamedType, type GQLSchema } from '../../shared/GQLTypes';
import getTypeInfo from '../_shared/getTypeInfo';

import { type QueryParser } from '../../config/GQLConfig';
import { getTokenAtPosition } from '../_shared/getTokenAtPosition';
import createRelaySchema from '../_shared/createRelaySchema';
import debug from '../../shared/debug';

function getInfoOfTokenAtPosition( // eslint-disable-line complexity
  _schema: GQLSchema,
  sourceText: string,
  position: Position,
  config: {
    parser: QueryParser,
    isRelay?: boolean,
  },
): ?GQLInfo {
  // console.log('getDef', sourceText, position);
  debug.time('getTokenAtPosition');
  const token = getTokenAtPosition(sourceText, position, config.parser);
  debug.timeEnd('getTokenAtPosition');

  if (!token) {
    return null;
  }

  const { state } = token;
  const { kind, step } = state;
  const schema = config.isRelay ? createRelaySchema(_schema) : _schema;
  const typeInfo = getTypeInfo(schema, state);

  // console.log(kind, step, typeInfo, 'state\n\n', state);

  if (
    (kind === 'NamedType' && step === 0) ||
    (kind === 'TypeCondition' && step === 1) || // fragment on TypeName <----
    (kind === 'Mutation' && step === 0) || // ----> mutation { }
    (kind === 'Subscription' && step === 0) || // ----> subscription {  }
    (kind === 'Query' && step === 0) // ----> query xyz { xyz }
  ) {
    if (typeInfo.type) {
      const type = getNamedType(typeInfo.type);
      if (type) {
        return { contents: [type.print()] };
      }
    }
    return null;
  }

  if (kind === 'Field' || kind === 'AliasedField') {
    if (!typeInfo.fieldDef) {
      return null;
    }
    const { fieldDef } = typeInfo;
    const contents = [];

    contents.push(fieldDef.print());

    if (typeInfo.parentType && (typeInfo.parentType.name === 'Mutation' || typeInfo.parentType.name === 'Subscription')) {
      // include input args type
      fieldDef.args.forEach((arg) => {
        const argType = getNamedType(arg.type);
        if (argType) {
          contents.push(argType.print());
        }
      });
    }

    // include type full definition
    const type = getNamedType(fieldDef.type);
    if (type) {
      contents.push(type.print());
    }

    return { contents };
  }

  if (kind === 'Argument') {
    const { argDef } = typeInfo;
    if (argDef) {
      const contents = [];
      contents.push(argDef.print());
      const type = getNamedType(argDef.type);
      if (type) {
        contents.push(type.print());
      }

      return { contents };
    }
  }

  if (kind === 'ObjectField') {
    if (typeInfo.objectFieldDefs) {
      const objectField = typeInfo.objectFieldDef;
      const contents = [];
      if (objectField) {
        contents.push(objectField.print());
        const type = getNamedType(objectField.type);
        if (type) {
          contents.push(type.print());
        }
      }
      return { contents };
    }
  }

  if (kind === 'Directive' && step === 1) {
    if (typeInfo.directiveDef) {
      return {
        contents: [typeInfo.directiveDef.print()],
      };
    }
  }

  return null;
}

export { getInfoOfTokenAtPosition };
