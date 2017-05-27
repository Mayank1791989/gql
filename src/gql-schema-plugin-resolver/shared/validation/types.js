/* @flow */
import ResolverSchemaValidationContext from './ResolverSchemaValidationContext';
import ResolverValidationContext from './ResolverValidationContext';
import { type ASTVisitor as SchemaASTVisitor } from 'graphql';
import { type ASTVisitor as ResolverASTVisitor } from '../language/visitor';

export type TypeSchemaResolverValidationRule = {|
  +type: 'Schema',
  create(context: ResolverSchemaValidationContext): SchemaASTVisitor,
|};

export type TypeLocalResolverValidationRule = {|
  +type?: 'Resolver',
  +isGlobal?: false,
  create(context: ResolverValidationContext): ResolverASTVisitor,
|};

export type TypeGlobalResolverValidationRule = {|
  +type?: 'Resolver',
  +isGlobal: true,
  create(context: ResolverValidationContext): ResolverASTVisitor,
|};

export type TypeResolverValidationRule =
  | TypeLocalResolverValidationRule
  | TypeGlobalResolverValidationRule;

export type ResolverValidationRule =
  | TypeSchemaResolverValidationRule
  | TypeLocalResolverValidationRule
  | TypeGlobalResolverValidationRule;
