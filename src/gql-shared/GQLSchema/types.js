/* @flow */
import type { ObjMap } from 'graphql/jsutils/ObjMap';
import { type NamedTypeNode, type TypeDefinitionNode } from 'graphql';

export type TypeDependenciesMap = ObjMap<
  Array<NamedTypeNode | TypeDefinitionNode>,
>;
