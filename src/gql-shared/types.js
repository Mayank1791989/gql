/* @flow  strict */
/* @babel-flow-runtime-enable */
import { Source, type FragmentDefinitionNode } from 'graphql';
export type AbsoluteFilePath = string;

export type Line = number; // (starts from 1)
export type Column = number; // (starts from 1)
export type GQLPosition = $ReadOnly<{| line: Line, column: Column |}>;
export type GQLLocation = $ReadOnly<{|
  start: GQLPosition,
  end: GQLPosition,
  path: AbsoluteFilePath,
|}>;
export type GQLHint = {|
  text: string,
  type?: string,
  description?: ?string,
|};
export type GQLInfo = $ReadOnly<{|
  contents: string | Array<string>,
  // description: string,
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

export type Document = { text: string, match: { start: string, end: string } };

export type Stream = any;

export interface IParser {
  // eslint-disable-line
  startState(): TokenState;
  token(stream: Stream, state: TokenState): string;
  supportsFragmentWithoutName?: () => boolean;
}

export interface ISchemaParser {
  getTokenAtPosition(source: Source, position: GQLPosition): Token;
  getDocuments(source: Source): $ReadOnlyArray<Document>;
}

export interface IQueryParser {
  getTokenAtPosition(source: Source, position: GQLPosition): Token;
  getDocuments(source: Source): $ReadOnlyArray<Document>;
  getFragmentDefinitionsAtPosition(
    context: $FixMe,
    source: Source,
    position: GQLPosition,
    filterByName?: string,
  ): $ReadOnlyArray<FragmentDefinitionNode>;
  supportsFragmentWithoutName(): boolean;
}

export type CommandParams = {|
  +source: Source,
  +position: GQLPosition,
|};

export interface ISchemaService {
  providers: $FixMe;
  getSchema(): GQLSchema;
}

export type SchemaPluginParams = {|
  +config: $FixMe,
  +schemaService: ISchemaService,
  +watcher: GQLWatcher,
|};

export interface ISchemaPlugin {
  start(): Promise<void>;
  stop(): Promise<void>;
  onChange(listener: () => void): { remove: () => void };
  onError(listener: (err: Error) => void): { remove: () => void };
  findRefsOfTokenAtPosition(params: CommandParams): $ReadOnlyArray<GQLLocation>;
  getDefinitionAtPosition(params: CommandParams): $ReadOnlyArray<GQLLocation>;
  getInfoOfTokenAtPosition(params: CommandParams): $ReadOnlyArray<GQLInfo>;
  getHintsAtPosition(params: CommandParams): $ReadOnlyArray<GQLHint>;
  getErrors(): $ReadOnlyArray<GQLError>;
}

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
