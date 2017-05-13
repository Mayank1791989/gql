/* @flow */
/* eslint-disable no-use-before-define */

import {
  GraphQLIncludeDirective,
  getNamedType as _getNamedType,
  GraphQLDeprecatedDirective,
  GraphQLScalarType,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLInputObjectType,
  GraphQLID,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLString,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLObjectType,
  GraphQLSkipDirective,
  GraphQLDirective,
  GraphqlField,

  SchemaMetaFieldDef as _SchemaMetaFieldDef,
  TypeMetaFieldDef as _TypeMetaFieldDef,
  TypeNameMetaFieldDef as _TypeNameMetaFieldDef,
} from 'graphql/type';

import { printType } from 'graphql/utilities/schemaPrinter';

import _keyBy from 'lodash/keyBy';

import {
  type TypeDefinitionNode,
  type FieldDefinitionNode,
  type ASTNode,
  type InputValueDefinitionNode,
  type DirectiveDefinitionNode,
} from 'graphql/language/ast';

export type GQLArgument = {
  name: string,
  // $FlowDisableNextLine
  type: GQLInputType,
  defaultValue?: mixed,
  description?: ?string,
  node: ?InputValueDefinitionNode,
  print: () => string,
};

export type GQLField = {
  name: string,
  description: ?string,
  // $FlowDisableNextLine
  type: GQLOutputType,
  // $FlowDisableNextLine
  args: Array<GQLArgument>,
  resolve?: any,
  isDeprecated?: boolean,
  deprecationReason?: ?string,
  node: ?FieldDefinitionNode,
  print: () => string,
};

export type GQLInputField = {
  name: string,
  // $FlowDisableNextLine
  type: GQLInputType,
  defaultValue?: mixed,
  description?: ?string,
  node: InputValueDefinitionNode,
  print: () => string,
};

type GQLInputFieldMap = {
  // $FlowDisableNextLine
  [fieldname: string]: GQLInputField,
};

type GQLFieldMap = {
  // $FlowDisableNextLine
  [fieldname: string]: GQLField,
};

export interface GQLSchema { // eslint-disable-line
  getQueryType(): ?GQLObjectType,
  getMutationType(): ?GQLObjectType,
  getSubscriptionType(): ?GQLObjectType,

  getType(name: string): ?GQLNamedType,
  getTypeMap(): { [name: string]: GQLNamedType },

  getDirective(name: string): ?GraphQLDirective,
  getDirectives(): Array<GQLDirective>,
  getPossibleTypes(type: any): Array<GQLObjectType>,

  // NOTE: not available in graphql-js (npm) [added in our custom GraphqlSchema]
  // getTypeNode(name: string): ?TypeDefinitionNode;
  // getTypeDependents(name: string): Array<ASTNode>;
}

export const typeName = {
  GQLObjectType: 'Object',
  GQLInputObjectType: 'Input',
  GQLEnumType: 'Enum',

  GQLScalarType: 'Scalar',
  GraphQLScalarType: 'Scalar', // native scalar types

  GQLInterfaceType: 'Interface',
  GQLUnionType: 'Union',
};

function memoize<T>(fn: T): T {
  let result = null;
  // $FlowDisableNextLine
  return (...args) => {
    if (result) { return result; }
    // $FlowDisableNextLine
    result = fn(...args);
    return result;
  };
}

export function getNamedType(type: ?GQLType): ?GQLNamedType {
  return (_getNamedType((type: any)): any);
}

export function printDescription(description: ?string): string {
  return description ? `# ${description}` : '';
}

function print(node: ?ASTNode, description: ?string, type: ?string): string {
  let defn = '';
  if (node && node.loc && node.loc.source && node.loc.source.body) {
    defn = node.loc.source.body.substr(node.loc.start, node.loc.end - node.loc.start);
  }
  return [
    printDescription(description),
    type ? `(${type}) ${defn}` : defn,
  ].filter(Boolean).join('\n');
}

function patchFields(fields: Array<GraphqlField>): Array<GQLField> {
  return Object.keys(fields).map((name) => {
    const field = fields[name];
    field.print = memoize(() => print(field.node, field.description, 'field'));
    field.args = field.args.map((arg, index) => ({
      ...arg,
      node: field.node.arguments[index],
      print: memoize(() => print(field.node.arguments[index], arg.description, 'argument')),
    }));
    return field;
  });
}

function patchInputFields(fields: GQLInputFieldMap) {
  Object.keys(fields).forEach((name) => {
    const field = fields[name];
    field.print = memoize(() => print(field.node, field.description, 'field'));
  });
}

export const GQLInt: GQLScalarType = GraphQLInt;
GQLInt.print = () => printDescription(GraphQLInt.description);

export const GQLID: GQLScalarType = GraphQLID;
GQLID.print = () => printDescription(GraphQLID.description);

export const GQLString: GQLScalarType = GraphQLString;
GQLString.print = () => printDescription(GraphQLString.description);

export const GQLFloat: GQLScalarType = GraphQLFloat;
GQLFloat.print = () => printDescription(GQLFloat.description);

export const GQLBoolean: GQLScalarType = GraphQLBoolean;
GQLBoolean.print = () => printDescription(GQLBoolean.description);

const [SchemaMetaFieldDef, TypeMetaFieldDef, TypeNameMetaFieldDef] = [
  _SchemaMetaFieldDef,
  _TypeMetaFieldDef,
  _TypeNameMetaFieldDef,
].map((field) => {
  const type = getNamedType(field.type);
  type.print = memoize(() => printType(type));

  return {
    ...field,
    print: memoize(() => {
      // HACK: graphql doesnt expose printField method
      // so creating fake type and printing it and extracting field string
      const printedType = printType(
        new GraphQLObjectType({
          name: 'Demo',
          fields: {
            FIELD_NAME: {
              ...field,
              args: Array.isArray(field.args)
                ? _keyBy(field.args, 'name')
                : field.args,
            },
          },
        }),
      ).replace('FIELD_NAME', `(meta-field) ${field.name}`);

      const lines = printedType.split('\n');
      return lines
        .slice(1, lines.length - 1) // remove first and last line which is type we need field only
        .map((line) => line.trim())
        .join('\n');
    }),
  };
});

export { SchemaMetaFieldDef, TypeMetaFieldDef, TypeNameMetaFieldDef };

function printArg(arg, indentation = '') {
  return [
    `${indentation}${printDescription(arg.description)}`,
    `${indentation}${arg.name}: ${arg.type.toString()}`,
  ].filter((val) => val && val.trim()).join('\n');
}

function printArgs(args) {
  if (args.length === 0) {
    return '';
  }

  const argsStr = args.map((arg) => printArg(arg, '  ')).join('\n');

  return `(\n${argsStr}\n)`;
}

export class GQLDirective extends GraphQLDirective {
  node: ?DirectiveDefinitionNode;
  // $FlowDisableNextLine
  args: Array<GQLArgument>;

  constructor(node: any, config: any) {
    super(config);
    this.node = node;
    this.args = this.args.map((arg, index) => ({
      ...arg,
      node: this.node ? node.arguments[index] : null,
      print: memoize(() => printArg(arg)),
    }));
  }

  print = memoize((): string => {
    if (this.node) {
      return print(this.node, this.description);
    }
    return [
      printDescription(this.description),
      `directive @${this.name}${printArgs(this.args)}`,
      `  on ${this.locations.join('\n   | ')}`,
    ].filter((val) => val).join('\n');
  });
}

function reduceArgs(args) {
  return args.reduce((acc, arg) => {
    acc[arg.name] = arg;
    return acc;
  }, {});
}

export const GQLIncludeDirective = new GQLDirective(null, {
  name: GraphQLIncludeDirective.name,
  description: GraphQLIncludeDirective.description,
  locations: GraphQLIncludeDirective.locations,
  args: reduceArgs(GraphQLIncludeDirective.args),
});
export const GQLSkipDirective = new GQLDirective(null, {
  name: GraphQLSkipDirective.name,
  description: GraphQLSkipDirective.description,
  locations: GraphQLSkipDirective.locations,
  args: reduceArgs(GraphQLSkipDirective.args),
});
export const GQLDeprecatedDirective = new GQLDirective(null, {
  name: GraphQLDeprecatedDirective.name,
  description: GraphQLDeprecatedDirective.description,
  locations: GraphQLDeprecatedDirective.locations,
  args: reduceArgs(GraphQLDeprecatedDirective.args),
});

export class GQLScalarType extends GraphQLScalarType {
  node: ?TypeDefinitionNode;
  dependents: Array<ASTNode> = [];

  constructor(node: any, config: any) {
    super(config);
    this.node = node;
  }

  print = memoize((): string => print(this.node, this.description));
}

export class GQLObjectType extends GraphQLObjectType {
  node: ?TypeDefinitionNode;
  dependents: Array<ASTNode> = [];

  constructor(node: any, config: any) {
    super(config);
    this.node = node;
  }

  getInterfaces(): Array<GQLInterfaceType> {
    return (super.getInterfaces(): any);
  }

  getFields(): GQLFieldMap {
    if (this._fields) { return this._fields; }
    const _fields: GQLFieldMap = super.getFields();
    patchFields(_fields);
    return (_fields: any);
  }

  print = memoize((): string => print(this.node, this.description));
}

export class GQLInterfaceType extends GraphQLInterfaceType {
  node: ?TypeDefinitionNode;
  dependents: Array<ASTNode> = [];

  constructor(node: any, config: any) {
    super(config);
    this.node = node;
  }

  getFields(): GQLFieldMap {
    if (this._fields) { return this._fields; }
    const _fields: GQLFieldMap = super.getFields();
    patchFields(_fields);
    return (_fields: any);
  }

  print = memoize((): string => print(this.node, this.description));
}

export class GQLUnionType extends GraphQLUnionType {
  node: ?TypeDefinitionNode;
  dependents: Array<ASTNode> = [];

  constructor(node: any, config: any) {
    super(config);
    this.node = node;
  }

  print = memoize((): string => print(this.node, this.description));
}

export class GQLEnumType extends GraphQLEnumType {
  node: ?TypeDefinitionNode;
  dependents: Array<ASTNode> = [];

  constructor(node: any, config: any) {
    super(config);
    this.node = node;
  }

  print = memoize((): string => print(this.node, this.description));
}

export class GQLInputObjectType extends GraphQLInputObjectType {
  node: ?TypeDefinitionNode;
  dependents: Array<ASTNode> = [];

  constructor(node: any, config: any) {
    super(config);
    this.node = node;
  }

  print = memoize((): string => print(this.node, this.description));

  getFields(): GQLInputFieldMap {
    if (this._fields) { return this._fields; }
    const fields: GQLInputFieldMap = super.getFields();
    patchInputFields(fields);
    return (fields: any);
  }
}

type GQLList<T> = { ofType: T };
type GQLNonNull<T> = { ofType: T };

export type GQLNamedType =
  GQLScalarType |
  GQLObjectType |
  GQLInterfaceType |
  GQLUnionType |
  GQLEnumType |
  GQLInputObjectType;

export type GQLType =
  GQLScalarType |
  GQLObjectType |
  GQLInterfaceType |
  GQLUnionType |
  GQLEnumType |
  GQLInputObjectType |
  GQLList<any> |
  GQLNonNull<any>;

export type GQLOutputType =
  GQLScalarType |
  GQLObjectType |
  GQLInterfaceType |
  GQLUnionType |
  GQLEnumType |
  GQLList<GQLOutputType> |
  GQLNonNull<GQLScalarType |
    GQLObjectType |
    GQLInterfaceType |
    GQLUnionType |
    GQLEnumType |
    GQLList<GQLOutputType>>;

export type GQLInputType =
  GQLScalarType |
  GQLEnumType |
  GQLInputObjectType |
  GQLList<GQLInputType> |
  GQLNonNull<GQLScalarType |
    GQLEnumType |
    GQLInputObjectType |
    GQLList<GQLInputType>>;
