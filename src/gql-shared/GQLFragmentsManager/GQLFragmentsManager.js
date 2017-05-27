/* @flow */
import { type FragmentDefinitionNode } from 'graphql';
import {
  checkFragmentScopesGlobal,
  type FragmentScope,
} from 'gql-shared/FragmentScope';
import { ParsedQueryFile } from 'gql-shared/GQLQueryFile';
import GQLFragment from './GQLFragment';

export default class GQLFragmentsManager {
  _fragmentsMap: Map<
    FragmentScope,
    Map</* fragName */ string, Array<GQLFragment>>,
  > = new Map();

  _fragmentsByAstMap: Map<
    /* ast: */ FragmentDefinitionNode,
    GQLFragment,
  > = new Map();

  _fragmentsByQueryFile: Map<
    /* queryFile */ ParsedQueryFile,
    Array<GQLFragment>,
  > = new Map();

  getFragments(
    scopes: Array<FragmentScope>,
    name: string,
  ): $ReadOnlyArray<GQLFragment> {
    const fragments = [];
    scopes.forEach(scope => {
      const allFragments = this._fragmentsMap.get(scope);
      if (!allFragments) {
        return;
      }
      const frags = allFragments.get(name);
      if (frags) {
        fragments.push(...frags);
      }
    });
    return fragments;
  }

  getFragmentByNode(node: FragmentDefinitionNode): ?GQLFragment {
    return this._fragmentsByAstMap.get(node);
  }

  getAllFragments(scopes: Array<FragmentScope>): $ReadOnlyArray<GQLFragment> {
    const fragments = [];
    scopes.forEach(scope => {
      const allFragments = this._fragmentsMap.get(scope);
      if (allFragments) {
        allFragments.forEach(frags => {
          fragments.push(...frags);
        });
      }
    });
    return fragments;
  }

  updateFragments(queryFiles: Map<string, ParsedQueryFile>) {
    // reset cache
    this._fragmentsByAstMap = new Map();
    this._fragmentsMap = new Map();

    // iterate over files and create fragments
    const newFragmentsByQueryFile = new Map();
    queryFiles.forEach(queryFile => {
      // NOTE: only creating Fragments for changed files
      const fragments =
        this._fragmentsByQueryFile.get(queryFile) ||
        this._getFragmentsFromQueryFile(queryFile);

      newFragmentsByQueryFile.set(queryFile, fragments);
      fragments.forEach(this._addFragment);
    });

    this._fragmentsByQueryFile = newFragmentsByQueryFile;
  }

  _addFragment = (fragment: GQLFragment) => {
    // add to ast
    this._fragmentsByAstMap.set(fragment.getNode(), fragment);

    // add fragment to scope name map
    fragment.getScopes().forEach(scope => {
      if (checkFragmentScopesGlobal([scope])) {
        const scopeFragments = this._fragmentsMap.get(scope) || new Map();
        const namedFragments = scopeFragments.get(fragment.getName()) || [];
        namedFragments.push(fragment);
        scopeFragments.set(fragment.getName(), namedFragments);
        this._fragmentsMap.set(scope, scopeFragments);
      }
    });
  };

  _getFragmentsFromQueryFile(queryFile: ParsedQueryFile) {
    if (queryFile.isEmpty()) {
      return [];
    }

    // create Fragment for each document
    return queryFile.getDocuments().reduce((acc, queryDocument) => {
      const queryFragments = queryDocument
        .getFragments()
        .map(node => new GQLFragment(node, queryDocument));
      acc.push(...queryFragments);
      return acc;
    }, []);
  }
}
