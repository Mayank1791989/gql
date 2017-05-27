/* @flow */
/* @babel-flow-runtime-enable */
export type AbsoluteFilePath = string;

export type Line = number; // (starts from 1)
export type Column = number; // (starts from 1)
export type GQLPosition = $ReadOnly<{| line: Line, column: Column |}>;
export type GQLLocation = $ReadOnly<{|
  start: GQLPosition,
  end: GQLPosition,
  path: AbsoluteFilePath,
|}>;

export type TokenState = {
  level: number,
  levels?: Array<number>,
  prevState: ?TokenState,
  rule: ?any,
  kind: ?string,
  name: ?string,
  type: ?string,
  step: number,
  needsSeperator: boolean,
  needsAdvance?: boolean,
  indentLevel?: number,
  jsInlineFragment?: ?{ count: number },
};

export type Token = {
  start: number,
  end: number,
  string: string,
  state: TokenState,
  style: string,
  prevChar: string,
};

export type Stream = any;

export interface IParser {
  options: Object;
  // eslint-disable-line
  startState(): TokenState;
  token(stream: Stream, state: TokenState): string;
}

export type GQLHint = {|
  text: string,
  type?: string,
  description?: ?string,
|};

export type GQLInfo = $ReadOnly<{|
  contents: string | Array<string>,
  // description: string,
|}>;

// validation
// FIXME: add strict type defn
export type IValidationContext = any;

export type ValidationRule = (context: IValidationContext) => any;
export type ValidationRulesPackage = {
  rules: { [name: string]: ValidationRule },
  config: {
    [ruleName: string]: 'off' | 'warn' | 'error',
  },
};

export type ValidationConfig = {
  rules?: {
    [ruleName: string]: 'off' | 'warn' | 'error',
  },
};

export type DirectiveAppliedOn = $ReadOnly<{
  kind: string,
  name: ?string,
}>;
