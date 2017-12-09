/* @flow */
/* eslint-disable no-use-before-define */
import {
  type Position,
  type GQLHint,
} from '../../shared/types';
import {
  typeName,
  GQLEnumType,
  getNamedType,
  type GQLSchema,

  SchemaMetaFieldDef,
  TypeMetaFieldDef,
  TypeNameMetaFieldDef,
} from '../../shared/GQLTypes';
import { type QueryParser } from '../../config/GQLConfig';
import getTokenAtPosition from '../_shared/getTokenAtPosition';
import { objectValues } from 'graphql-language-service-interface/dist/autocompleteUtils';
import {
  isAbstractType,
  GraphQLBoolean,

  isInputType,
  isCompositeType,
} from 'graphql/type';

import getTypeInfo from '../_shared/getTypeInfo';
import createRelaySchema from '../_shared/createRelaySchema';

export default function getHintsAtPosition( // eslint-disable-line complexity
  _schema: GQLSchema,
  sourceText: string,
  _position: Position,
  config: {
    parser: QueryParser,
    isRelay?: boolean,
  },
): Array<GQLHint> {
  const position = { line: _position.line, column: _position.column - 1 };
  const token = getTokenAtPosition(sourceText, position, config.parser);
  // ignore if inside comment
  if (token.style === 'comment') {
    return [];
  }

  const schema = config.isRelay ? createRelaySchema(_schema) : _schema;
  const typeInfo = getTypeInfo(schema, token.state);

  const { state } = token;
  const { kind, step } = state;

  // console.log(typeInfo);
  // console.log(token);
  // console.log(kind, step);

  // Definition kinds
  if (kind === 'Document') {
    return [
      { text: 'query' },
      { text: 'mutation' },
      { text: 'subscription' },
      { text: 'fragment' },
      { text: '{' },
    ];
  }

  if (kind === 'Mutation' || kind === 'Subscription' || kind === 'Query') {
    const { type } = typeInfo;
    return [{
      text: token.string,
      type: type ? type.toString() : '',
      description: type ? type.description : '',
    }];
  }

  if (kind === 'FragmentDefinition') {
    return [
      {
        text: 'fragment',
      },
    ];
  }

  // Argument names
  // console.log(kind, step, position);

  // Field names
  if (kind === 'SelectionSet' || kind === 'Field' || kind === 'AliasedField') {
    if (typeInfo.parentType) {
      const fields = typeInfo.parentType.getFields
        // $FlowDisableNextLine
        ? objectValues(typeInfo.parentType.getFields())
        : [];
      if (isAbstractType(typeInfo.parentType)) {
        fields.push(TypeNameMetaFieldDef);
      }
      if (typeInfo.parentType === schema.getQueryType()) {
        fields.push(SchemaMetaFieldDef, TypeMetaFieldDef);
      }
      return fields.map((field) => ({
        text: field.name,
        type: field.type.toString(),
        description: field.description,
      }));
    }
  }

  if (kind === 'Arguments' || (kind === 'Argument' && step === 0)) {
    const { argDefs } = typeInfo;
    if (argDefs) {
      return (argDefs.map((argDef) => ({
        text: argDef.name,
        type: argDef.type.toString(),
        description: argDef.description,
      })));
    }
  }

  // Input Object fields
  if (kind === 'ObjectValue' || (kind === 'ObjectField' && step === 0)) {
    if (typeInfo.objectFieldDefs) {
      const objectFields = objectValues(typeInfo.objectFieldDefs);
      return (objectFields.map((field) => ({
        text: field.name,
        type: field.type.toString(),
        description: field.description,
      })));
    }
  }

  // Input values: Enum and Boolean
  if (
    (kind === 'EnumValue') ||
    (kind === 'ListValue' && step === 1) ||
    (kind === 'ObjectField' && step === 2) ||
    (kind === 'Argument' && step === 2)
  ) {
    const namedInputType = getNamedType(typeInfo.inputType);
    if (namedInputType instanceof GQLEnumType) {
      const valueMap = namedInputType.getValues();
      const values = objectValues(valueMap);
      return (values.map((value) => ({
        text: value.name,
        type: namedInputType.toString(),
        description: value.description,
      })));
    } else if (namedInputType === GraphQLBoolean) {
      return [
        { text: 'true', type: GraphQLBoolean, description: 'Not false.' },
        { text: 'false', type: GraphQLBoolean, description: 'Not true.' },
      ];
    }
  }

  // Fragment type conditions
  if (
    (kind === 'TypeCondition' && step === 1) ||
    (kind === 'NamedType' && state.prevState.kind === 'TypeCondition')
  ) {
    let possibleTypes = null;
    if (typeInfo.parentType) {
      if (isAbstractType(typeInfo.parentType)) {
        // Collect both the possible Object types as well as the interfaces
        // they implement.
        const possibleObjTypes = schema.getPossibleTypes(typeInfo.parentType);
        const possibleIfaceMap = Object.create(null);
        possibleObjTypes.forEach((type) => {
          type.getInterfaces().forEach((iface) => {
            possibleIfaceMap[iface.name] = iface;
          });
        });
        possibleTypes = possibleObjTypes.concat(objectValues(possibleIfaceMap));
      } else {
        // The parent type is a non-abstract Object type, so the only possible
        // type that can be used is that same type.
        possibleTypes = [typeInfo.parentType];
      }
    } else {
      const typeMap = schema.getTypeMap();
      possibleTypes = objectValues(typeMap).filter(isCompositeType);
    }
    return possibleTypes.map((type) => ({
      text: type.name,
      type: typeName[type.constructor.name],
      description: type.description,
    }));
  }

  // Fragment spread names
  // if (kind === 'FragmentSpread' && step === 1) {
  //   const typeMap = schema.getTypeMap();
  //   const defState = getDefinitionState(token.state);
  //   // const fragments = getFragmentDefinitions(sourceText);

  //   // Filter down to only the fragments which may exist here.
  //   const relevantFrags = fragments.filter(frag =>
  //     // Only include fragments with known types.
  //     typeMap[frag.typeCondition.name.value] &&
  //     // Only include fragments which are not cyclic.
  //     !(defState &&
  //       defState.kind === 'FragmentDefinition' &&
  //       defState.name === frag.name.value) &&
  //     // Only include fragments which could possibly be spread here.
  //     doTypesOverlap(
  //       schema,
  //       typeInfo.parentType,
  //       typeMap[frag.typeCondition.name.value],
  //     ),
  //   );

  //   return relevantFrags.map(frag => ({
  //     text: frag.name.value,
  //     type: typeMap[frag.typeCondition.name.value],
  //     description:
  //       `fragment ${frag.name.value} on ${frag.typeCondition.name.value}`,
  //   }));
  // }

  // Variable definition types
  if (
    (kind === 'VariableDefinition' && step === 2) ||
    (kind === 'ListType' && step === 1) ||
    (kind === 'NamedType' && (
      state.prevState.kind === 'VariableDefinition' ||
      state.prevState.kind === 'ListType'
    ))
  ) {
    const inputTypeMap = schema.getTypeMap();
    const inputTypes = objectValues(inputTypeMap).filter(isInputType);
    return inputTypes.map((type) => ({
      text: type.name,
      description: type.description,
    }));
  }

  // Directive names
  if (kind === 'Directive') {
    const directives = schema.getDirectives().filter(
      (directive) => canUseDirective(state.prevState.kind, directive),
    );
    return directives.map((directive) => ({
      text: directive.name,
      description: directive.description,
    }));
  }

  return [];
}

function canUseDirective(kind, directive) {
  const { locations } = directive;
  switch (kind) {
    case 'Query':
      return locations.indexOf('QUERY') !== -1;
    case 'Mutation':
      return locations.indexOf('MUTATION') !== -1;
    case 'Subscription':
      return locations.indexOf('SUBSCRIPTION') !== -1;
    case 'Field':
    case 'AliasedField':
      return locations.indexOf('FIELD') !== -1;
    case 'FragmentDefinition':
      return locations.indexOf('FRAGMENT_DEFINITION') !== -1;
    case 'FragmentSpread':
      return locations.indexOf('FRAGMENT_SPREAD') !== -1;
    case 'InlineFragment':
      return locations.indexOf('INLINE_FRAGMENT') !== -1;
    default:
      break;
  }
  return false;
}

export { getHintsAtPosition };
