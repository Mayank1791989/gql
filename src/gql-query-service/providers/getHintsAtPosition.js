/* @flow */
/* eslint-disable no-use-before-define, complexity */
import {
  isAbstractType,
  GraphQLBoolean,
  isInputType,
  isCompositeType,
  getNamedType,
  SchemaMetaFieldDef,
  TypeMetaFieldDef,
  TypeNameMetaFieldDef,
  isEnumType,
  doTypesOverlap,
  GraphQLDirective,
} from 'graphql';

import { type GQLHint } from 'gql-shared/types';
import objectValues from 'gql-shared/objectValues';
import isFieldsType from 'gql-shared/isFieldsType';
import { getDefinitionState } from 'gql-shared/GQLParser';
import { type ProviderParams } from './types';
import { createHintForEnumValue, createHintForType } from 'gql-shared/hints';

// import printTokenState from 'gql-shared/printTokenState';

export default function getHintsAtPosition(
  params: ProviderParams,
): $ReadOnlyArray<GQLHint> {
  const { token, typeInfo, context, source, position } = params;

  // ignore if inside comment
  if (token.style === 'comment') {
    return [];
  }

  const { state } = token;
  const { kind, step } = state;

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
    const type = typeInfo.getType();
    return [
      {
        text: token.string,
        type: type ? String(type) : '',
        description: type ? (type: any).description : '',
      },
    ];
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
    const parentType = typeInfo.getParentType();
    if (parentType) {
      const fields = isFieldsType(parentType)
        ? objectValues(parentType.getFields())
        : [];
      if (isAbstractType(parentType)) {
        fields.push(TypeNameMetaFieldDef);
      }
      if (parentType === context.getQueryType()) {
        fields.push(SchemaMetaFieldDef, TypeMetaFieldDef);
      }
      return fields.map(field => ({
        text: field.name,
        type: field.type.toString(),
        description: field.description,
      }));
    }
    return [];
  }

  if (kind === 'Arguments' || (kind === 'Argument' && step === 0)) {
    const argDefs = typeInfo.getArguments();
    if (argDefs) {
      return argDefs.map(argDef => ({
        text: argDef.name,
        type: argDef.type.toString(),
        description: argDef.description,
      }));
    }
  }

  // Input Object fields
  if (kind === 'ObjectValue' || (kind === 'ObjectField' && step === 0)) {
    const objectFields = typeInfo.getObjectFields();
    if (objectFields) {
      const objectFieldDefs = objectValues(objectFields);
      return objectFieldDefs.map(field => ({
        text: field.name,
        type: field.type.toString(),
        description: field.description,
      }));
    }
  }

  // Input values: Enum and Boolean
  if (
    kind === 'EnumValue' ||
    (kind === 'ListValue' && step === 1) ||
    (kind === 'ObjectField' && step === 2) ||
    (kind === 'Argument' && step === 2)
  ) {
    const inputType = typeInfo.getInputType();
    const namedInputType = getNamedType(inputType);
    if (isEnumType(namedInputType)) {
      const values = namedInputType.getValues();
      return values.map(value => createHintForEnumValue(value, namedInputType));
    } else if (namedInputType === GraphQLBoolean) {
      return [
        {
          text: 'true',
          type: String(GraphQLBoolean),
          description: 'Not false.',
        },
        {
          text: 'false',
          type: String(GraphQLBoolean),
          description: 'Not true.',
        },
      ];
    }
  }

  // Fragment type conditions
  if (
    (kind === 'TypeCondition' && step === 1) ||
    (kind === 'NamedType' &&
      state.prevState &&
      state.prevState.kind === 'TypeCondition')
  ) {
    let possibleTypes = null;
    const parentType = typeInfo.getParentType();
    if (parentType) {
      if (isAbstractType(parentType)) {
        // Collect both the possible Object types as well as the interfaces
        // they implement.
        const possibleObjTypes = context.getPossibleTypes(parentType);
        const possibleIfaceMap = Object.create(null);
        possibleObjTypes.forEach(type => {
          type.getInterfaces().forEach(iface => {
            possibleIfaceMap[iface.name] = iface;
          });
        });
        possibleTypes = possibleObjTypes.concat(objectValues(possibleIfaceMap));
      } else {
        // The parent type is a non-abstract Object type, so the only possible
        // type that can be used is that same type.
        possibleTypes = [parentType];
      }
    } else {
      const typeMap = context.getTypeMap();
      possibleTypes = objectValues(typeMap).filter(isCompositeType);
    }
    return possibleTypes.map(createHintForType);
  }

  // Fragment spread names
  if (kind === 'FragmentSpread' && step === 1) {
    const typeMap = context.getSchema().getTypeMap();
    const defState = getDefinitionState((token.state: any));
    const parentType = typeInfo.getParentType();
    const fragments = context
      .getParser()
      .getFragmentDefinitionsAtPosition(context, source, position);

    // Filter down to only the fragments which may exist here.
    // console.log(fragments);
    const relevantFrags = fragments.filter(frag => {
      const fragType = typeMap[frag.typeCondition.name.value];
      return (
        // Only include fragments with known types.
        typeMap[frag.typeCondition.name.value] &&
        // Only include fragments which are not cyclic.
        !(
          defState &&
          defState.kind === 'FragmentDefinition' &&
          defState.name === frag.name.value
        ) &&
        // Only include fragments which could possibly be spread here.
        (parentType &&
          isCompositeType(fragType) &&
          doTypesOverlap(context.getSchema(), parentType, fragType))
      );
    });

    return relevantFrags.map(frag => ({
      text: frag.name.value,
      type: typeMap[frag.typeCondition.name.value].toString(),
      description: `fragment ${frag.name.value} on ${frag.typeCondition.name.value}`,
    }));
  }

  // Variable definition types
  if (
    (kind === 'VariableDefinition' && step === 2) ||
    (kind === 'ListType' && step === 1) ||
    (kind === 'NamedType' &&
      state.prevState &&
      (state.prevState.kind === 'VariableDefinition' ||
        state.prevState.kind === 'ListType' ||
        state.prevState.kind === 'NonNullType'))
  ) {
    const inputTypeMap = context.getTypeMap();
    const inputTypes = objectValues(inputTypeMap).filter(isInputType);
    return inputTypes.map(createHintForType);
  }

  // Directive names
  const { prevState } = state;
  if (kind === 'Directive' && prevState && prevState.kind) {
    const appliedOn = {
      kind: prevState.kind,
      name: prevState.name,
    };

    const directives = context
      .getDirectives(appliedOn)
      .filter(directive => canUseDirective(prevState.kind, directive));

    return directives.map(createHintForType);
  }

  return [];
}

function canUseDirective(kind: ?string, directive: GraphQLDirective) {
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
