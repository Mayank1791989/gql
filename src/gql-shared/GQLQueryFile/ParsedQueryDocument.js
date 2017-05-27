/* @flow */
import {
  type DocumentNode,
  type FragmentDefinitionNode,
  Source,
  visit,
} from 'graphql';
import { type QueryConfigResolved } from 'gql-config/types';
import { type GQLError } from 'gql-shared/GQLError';
import invariant from 'invariant';

export default class ParsedQueryDocument {
  _ast: ?DocumentNode;
  _parseError: ?GQLError;
  _config: QueryConfigResolved;
  _source: Source;
  _match: { start: string, end: string };

  _fragmentsMap: Map<string, $ReadOnlyArray<FragmentDefinitionNode>>;
  _fragmentsList: Array<FragmentDefinitionNode>;

  constructor(
    ast: ?DocumentNode,
    parseError: ?GQLError,
    source: Source,
    config: QueryConfigResolved,
    match: { start: string, end: string },
  ) {
    this._ast = ast;
    this._parseError = parseError;
    this._source = source;
    this._config = config;
    this._match = match;
  }

  getNode(): DocumentNode {
    invariant(this._ast, 'expecting ast to be present here');
    return this._ast;
  }

  getFragments(): $ReadOnlyArray<FragmentDefinitionNode> {
    if (!this._ast) {
      return [];
    }

    if (!this._fragmentsList) {
      const fragments = [];
      // visit and extract fragments
      visit(this._ast, {
        FragmentDefinition(node: FragmentDefinitionNode) {
          fragments.push(node);
          // skip iterating sub-tree
          return false;
        },
      });
      this._fragmentsList = fragments;
    }

    return this._fragmentsList;
  }

  getFragment(name: string): $ReadOnlyArray<FragmentDefinitionNode> {
    const fragmentsMap = this._getFragmentsMap();
    if (!fragmentsMap) {
      return [];
    }
    return fragmentsMap.get(name) || [];
  }

  getFilePath(): string {
    return this._source.name;
  }

  getParseError() {
    return this._parseError;
  }

  getParserMatch() {
    return this._match;
  }

  getConfig() {
    return this._config;
  }

  _getFragmentsMap() {
    if (!this._fragmentsMap) {
      const fragmentsMap: Map<
        string,
        $ReadOnlyArray<FragmentDefinitionNode>,
      > = new Map();
      this.getFragments().forEach(node => {
        const name = node.name.value;
        const fragments = fragmentsMap.get(name) || [];
        fragmentsMap.set(name, [...fragments, node]);
      });
      this._fragmentsMap = fragmentsMap;
    }

    return this._fragmentsMap;
  }
}
