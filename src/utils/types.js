/* @flow */
import type { DocumentNode, ASTNode } from 'graphql/language/ast';

export type { DocumentNode, ASTNode };
export type ParsedFilesMap = Map<string, Object>;

export type GQLConfig = $Exact<{
  path: string,
  dir: string, // config directory
  schema: {
    files: string // glob
  },
}>;

export type WatchFile = $Exact<{
  name: string,
  exists: bool,
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

export type GQLError = {
  message: string,
  severity: string,
  // if locations is missing then error is not in single file
  // e.g Schema needs 'query' defined in some file
  locations: ?Array<Location>
};

export type TokenState = $Exact<{
  kind: string,
  name: string,
  step: number,
  prevState: TokenState,
}>;

export type Token = $Exact<{
  start: number,
  end: number,
  string: string,
  state: TokenState,
  style: string,
  prevChar: string,
}>;

export type Hint = $Exact<{
  text: string,
  type?: string,
  description?: ?string,
}>;
