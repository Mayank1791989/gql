[![Travis](https://img.shields.io/travis/Mayank1791989/gql.svg?style=flat-square)](https://travis-ci.org/Mayank1791989/gql)
[![Codecov](https://img.shields.io/codecov/c/github/Mayank1791989/gql.svg?style=flat-square)](https://codecov.io/gh/Mayank1791989/gql)
[![npm](https://img.shields.io/npm/v/@playlyfe/gql.svg?style=flat-square)](https://www.npmjs.com/package/@playlyfe/gql)

# gql

> Graphql sevice which watches project files and provides:

#### Schema
- [x] Validation
- [x] Autocompletion
- [x] Get Defintion
- [x] Find References
- [x] Get Info of symbol at position.
- [x] Watch files and auto update

#### Query
- [x] Validation
- [x] Autocompletion
- [x] Get Definition
- [x] Support Embedded queries (Relay.QL, gql, others)
- [x] Get Info of symbol
- [ ] Find References
- [ ] Provide query schema dependency graph.

## Installation

1. Install the node package:
  ```yarn add @playlyfe/gql --dev``` or ```npm install @playlyfe/gql --dev```
2. Make sure [watchman](https://facebook.github.io/watchman/docs/install.html) is installed.
3. Create the [.gqlconfig](#gqlconfig) file in project root.

## .gqlconfig
The configuration file is specified in the [json5](http://json5.org/) format.

To specify the configuration, you can refer to the configuration definition schema.
<details>
<summary>View configuration definition schema</summary>

```javascript
type GQLConfig = {
  schema: {
    files: FileMatchConfig,
    validate?: ValidateConfig
  },
  query?: { // query optional
    files: Array<{
      match: FileMatchConfig, // match files
      parser: QueryParser,
      isRelay?: boolean,
      validate?: ValidateConfig,
    }>
  }
};

type FileMatchConfig = Globs | { include: Globs, ignore?: Globs };
type Globs = string | Array<string>; // eg **/*.js  **/*.gql

type QueryParser = (
  'QueryParser'
  | ['EmbeddedQueryParser', { startTag: regexpStr, endTag: regexpStr }];
);

type ValidateConfig = {
  extends: 'gql-rules-schema' | 'gql-rules-query' | 'gql-rules-query-relay',
  rules?: {
    [ruleName: string]: 'off' | 'warn' | 'error',
  },
};
```
</details>

### Examples

Specifying only schema support (query parsing and related features are disabled):
```javascript
// .gqlconfig (only schema)
{
  schema: {
    files: 'schema/**/*.gql'
  }
}
```

Specifying query and schema support:
```javascript
// .gqlconfig (with query)
{
  schema: {
    files: 'schema/**/*.gql',
  },
  query: {
    files: [
      // query gql files
      {
        match: 'path/to/files/**/*.gql',
        parser: 'QueryParser',
      },
      // [Embedded queries] relay files
      {
        match: { include: 'path/to/code/**/*.js', ignore: '**/tests/**/*.js' },
        parser: [ 'EmbeddedQueryParser', { startTag: 'Relay\\.QL`', endTag: '`' } ],
        isRelay: true,
      },
      // [Embedded queries] gql tag files
      {
        match: { include: 'path/to/code/**/*.js', ignore: '**/tests/**/*.js' },
        parser: [ 'EmbeddedQueryParser', { startTag: 'gql`', endTag: '`' } ],
      },
      // [Embedded queries] some other tags
      {
        match: 'path/to/code/**/*.xyz',
        parser: [ 'EmbeddedQueryParser', { startTag: '"""' endTag: '"""' } ],
      },
      // [Embedded queries] some other tags and modify validation rules
      {
        match: 'path/to/code/**/*.xyz',
        parser: [ 'EmbeddedQueryParser', { startTag: '"""' endTag: '"""' } ],
        validate: {
          extends: 'gql-rules-query',
          rules: {
            LoneAnonymousOperation: 'off',
            NoUnusedVariables: 'warn',
          },
        }
      },
    ]
  }
}
```

## Plugins
* vscode: [graphql-for-vscode](https://github.com/kumarharsh/graphql-for-vscode)
* SublimeText: @TODO
* cli: @TODO

## API

If you're looking to implement the GQL service in a plugin,
you'll need to call these service APIs:

```javascript
class GQLService {
  constructor(options: ?Options)

  /*** List of supported commands ***/

  // query errors
  status(): Array<GQLError>

  // autocomplete suggestion at position
  autocomplete(params: CommandParams): Array<GQLHint>

  // Gets the definition location
  getDef(params: CommandParams): ?DefLocation

  // Find all refs of symbol at position
  findRefs(params: CommandParams): Array<DefLocation>

  // gets the info of symbol at position
  getInfo(params: CommandParams): ?GQLInfo

  /*** Helpers ***/

  // return different file extensions found in .gqlconfig
  getFileExtensions(): Array<string>
}

type Options = {
  cwd?: string,
  onChange?: () => void, // called when something changes
  onInit?: () => void, // called once after initialization
  debug?: boolean, // enable debug logs
};

type CommandParams = {
  sourceText: string,
  sourcePath: string,
  position: {
    line: number, // starts with 1
    column: number, // starts with 1
  },
};

type DefLocation = {
  start: { line: number, column: number },
  end: { line: number, column: number },
  path: AbsoluteFilePath,
};

type GQLError = {
  message: string,
  severity: 'warn' | 'error',
  locations: ?Array<{ line: number, column: number, path: AbsolutePath }>,
};

type GQLHint = {
  text: string,
  type?: string,
  description?: string,
};

```
