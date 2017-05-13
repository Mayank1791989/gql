/* @flow */
export type ParsedFilesMap = Map<string, Object>;
export type WatchFile = $Exact<{
  name: string,
  exists: boolean,
}>;

export type AbsoluteFilePath = string;

// NOTE: graphql all line, column startsWith 1 (not zero)
type Line = number; // (starts from 1)
type Column = number; // (starts from 1)
export type Location = { line: Line, column: Column, path: AbsoluteFilePath };
export type Position = { line: Line, column: Column };
export type DefLocation = {
  start: Position,
  end: Position,
  path: AbsoluteFilePath,
};

export type TokenState = {
  kind: string,
  name: string,
  step: number,
  prevState: TokenState,
  type?: string,
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

export interface IParser { // eslint-disable-line
  startState(): TokenState,
  token(stream: Stream, state: TokenState): string,
}

export type GQLHint = $Exact<{
  text: string,
  type?: string,
  description?: ?string,
}>;

export type GQLInfo = {
  contents: string | Array<string>,
  // description: string,
};

// validation
import { ValidationContext } from 'graphql/validation/validate';
export type ValidationRule = (context: ValidationContext) => any;
export type ValidationRulesPackage = {
  rules: Array<ValidationRule>,
  config: {
    [ruleName: string]: 'off' | 'warn' | 'error',
  },
};
