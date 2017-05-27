/* @flow */
import QueryContext from './QueryContext';
import { ValidationTypeInfo, ValidationContext } from 'gql-shared/GQLValidate';
import {
  type ASTVisitor,
  type TypeNode,
  type NameNode,
  type ValueNode,
  type ArgumentNode,
  type FragmentDefinitionNode,
} from 'graphql';

import { checkFragmentScopesGlobal } from 'gql-shared/FragmentScope';
import { ParsedQueryDocument } from 'gql-shared/GQLQueryFile';

export type FragmentVariableDefinition = $ReadOnly<{
  +node: ArgumentNode,
  +name: NameNode,
  +type: ?TypeNode,
  +defaultValue?: ValueNode,
}>;

export default class QueryValidationContext extends ValidationContext {
  _context: QueryContext;
  _queryDocument: ParsedQueryDocument;

  constructor(
    context: QueryContext,
    parsedQueryDocument: ParsedQueryDocument,
    typeInfo: ValidationTypeInfo,
  ) {
    super(context.getSchema(), parsedQueryDocument.getNode(), typeInfo);
    this._context = context;
    this._queryDocument = parsedQueryDocument;
  }

  getFragment(name: string): ?FragmentDefinitionNode {
    const { fragmentScopes } = this._context.getConfig();
    if (checkFragmentScopesGlobal(fragmentScopes)) {
      const [fragment] = this._context.getFragments(name);
      if (fragment) {
        return fragment.getNode();
      }
      return null;
    }

    const [fragment] = this._queryDocument.getFragment(name);
    return fragment;
  }

  getFragmentVariableDefinitions(
    node: FragmentDefinitionNode,
  ): $ReadOnlyArray<FragmentVariableDefinition> {
    console.warn('This function is not implemented', node.name.value);
    return [];
  }

  getFragmentsManager() {
    return this._context.getFragmentsManager();
  }

  getQueryDocument() {
    return this._queryDocument;
  }
}

export type QueryValidationRule = {
  +create: (context: QueryValidationContext) => ASTVisitor,
};
