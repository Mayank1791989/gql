/* @flow */
/* eslint-disable complexity */
import { type GQLInfo } from 'gql-shared/types';
import { getNamedType } from 'graphql';
import { type ProviderParams } from './types';

export default function getInfoOfTokenAtPosition(
  params: ProviderParams,
): $ReadOnlyArray<GQLInfo> {
  const { token, typeInfo, context, source, position } = params;
  const { state } = token;
  const { kind, step } = state;
  // console.log(kind, step, typeInfo, 'state\n\n', state);
  // console.log(kind, step);

  if (
    (kind === 'NamedType' && step === 0) ||
    (kind === 'TypeCondition' && step === 1) || // fragment on TypeName <----
    (kind === 'Mutation' && step === 0) || // -----> mutation { }
    (kind === 'Subscription' && step === 0) || // ---> subscription { }
    (kind === 'Query' && step === 0) // ----> query xyz { xyz }
  ) {
    const type = typeInfo.getType() || typeInfo.getInputType();
    if (type) {
      const namedType = getNamedType(type);
      if (namedType) {
        return [{ contents: [context.getPrinter().printType(namedType)] }];
      }
    }
    return [];
  }

  if (kind === 'Field' || kind === 'AliasedField') {
    const fieldDef = typeInfo.getFieldDef();
    if (!fieldDef) {
      return [];
    }
    const contents = [];
    contents.push(context.getPrinter().printField(fieldDef));
    const parentType = typeInfo.getParentType();
    if (
      parentType &&
      (parentType.name === 'Mutation' || parentType.name === 'Subscription')
    ) {
      // include input args type
      fieldDef.args.forEach(arg => {
        const argType = getNamedType(arg.type);
        if (argType) {
          contents.push(context.getPrinter().printType(argType));
        }
      });
    }

    // include type full definition
    const namedType = getNamedType(fieldDef.type);
    if (namedType) {
      contents.push(context.getPrinter().printType(namedType));
    }

    return [{ contents }];
  }

  if (kind === 'Argument') {
    const argDef = typeInfo.getArgument();
    if (argDef) {
      const contents = [];
      contents.push(context.getPrinter().printArg(argDef));
      const namedType = getNamedType(argDef.type);
      if (namedType) {
        contents.push(context.getPrinter().printType(namedType));
      }

      return [{ contents }];
    }
  }

  if (kind === 'ObjectField') {
    const objectField = typeInfo.getObjectFieldDef();
    if (objectField) {
      const contents = [];
      contents.push(context.getPrinter().printInputField(objectField));
      const type = getNamedType(objectField.type);
      if (type) {
        contents.push(context.getPrinter().printType(type));
      }
      return [{ contents }];
    }
  }

  if (kind === 'Directive' && step === 1) {
    const directiveDef = typeInfo.getDirective();
    if (directiveDef) {
      return [
        {
          contents: [context.getPrinter().printDirective(directiveDef)],
        },
      ];
    }
  }

  if (kind === 'FragmentSpread' && state.name) {
    const fragName = state.name;
    const frags = context
      .getParser()
      .getFragmentDefinitionsAtPosition(context, source, position, fragName);

    if (frags.length > 0) {
      return [
        {
          contents: [context.getPrinter().printASTNode(frags[0])],
        },
      ];
    }
  }

  return [];
}
