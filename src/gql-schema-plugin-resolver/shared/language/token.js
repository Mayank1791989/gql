/* @flow strict */
export type TypeToken = {|
  +kind: 'Type',
  +name: string,
|};

export type FieldToken = {|
  +kind: 'Field',
  +name: string,
  +type: string,
|};

export type ObjectTypeToken = {|
  +kind: 'ObjectType',
  +name: string,
|};

export type ObjectFieldToken = {|
  +kind: 'ObjectField',
  +name: string,
  +type: string,
|};

export type ScalarTypeToken = {|
  +kind: 'Scalar',
  +name: string,
|};

export type EnumTypeToken = {|
  +kind: 'Enum',
  +name: string,
|};

export type EnumValueToken = {|
  +kind: 'EnumValue',
  +name: string,
  +type: string,
|};

export type DirectiveToken = {|
  +kind: 'Directive',
  +name: string,
|};

export type ResolverToken =
  | TypeToken
  | FieldToken
  | ObjectTypeToken
  | ObjectFieldToken
  | ScalarTypeToken
  | EnumTypeToken
  | EnumValueToken
  | DirectiveToken;
