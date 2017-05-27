/* @flow strict */
import { type Source } from 'graphql';

export type Location = {
  +start: number,
  +end: number,
  +source: Source,
};

export type NameNode = {
  +kind: 'Name',
  +loc: Location,
  +value: string,
};

type TypeResolverNode = {
  +kind: 'TypeResolver',
  +loc: Location,
  +name: NameNode,
};

type FieldResolverNode = {
  +kind: 'FieldResolver',
  +loc: Location,
  +name: NameNode,
  +type: NameNode,
};

type ObjectTypeResolverNode = {
  +kind: 'ObjectTypeResolver',
  +loc: Location,
  +name: NameNode,
};

type ObjectFieldResolverNode = {
  +kind: 'ObjectFieldResolver',
  +loc: Location,
  +name: NameNode,
  +type: NameNode,
};

type ResolveTypeResolverNode = {
  +kind: 'ResolveTypeResolver',
  +loc: Location,
  +name: NameNode,
};

type ScalarTypeResolverNode = {
  +kind: 'ScalarTypeResolver',
  +loc: Location,
  +name: NameNode,
};

type EnumTypeResolverNode = {
  +kind: 'EnumTypeResolver',
  +loc: Location,
  +name: NameNode,
};

type EnumValueResolverNode = {
  +kind: 'EnumValueResolver',
  +loc: Location,
  +name: NameNode,
  +type: NameNode,
};

type DirectiveResolverNode = {
  +kind: 'DirectiveResolver',
  +loc: Location,
  +name: NameNode,
};

export type ResolverNode =
  | TypeResolverNode
  | FieldResolverNode
  | ObjectTypeResolverNode
  | ObjectFieldResolverNode
  | ResolveTypeResolverNode
  | ScalarTypeResolverNode
  | EnumTypeResolverNode
  | EnumValueResolverNode
  | DirectiveResolverNode;

export type ResolverDocumentNode = {
  +kind: 'ResolverDocument',
  +resolvers: $ReadOnlyArray<ResolverNode>,
  +loc?: Location,
};

export type ASTNode = ResolverDocumentNode | ResolverNode | NameNode;

/**
 * Utility type listing all nodes indexed by their kind.
 */
export type ASTKindToNode = {|
  Name: NameNode,
  ResolverDocument: ResolverDocumentNode,
  TypeResolver: TypeResolverNode,
  FieldResolver: FieldResolverNode,
  ObjectTypeResolver: ObjectTypeResolverNode,
  ObjectFieldResolver: ObjectFieldResolverNode,
  ResolveTypeResolver: ResolveTypeResolverNode,
  ScalarTypeResolver: ScalarTypeResolverNode,
  EnumTypeResolver: EnumTypeResolverNode,
  EnumValueResolver: EnumValueResolverNode,
  DirectiveResolver: DirectiveResolverNode,
|};
