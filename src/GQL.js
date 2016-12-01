/* @flow */
// import { validate } from './validation/validate';
import { getHintsAtPosition } from './utils/getHintsAtPosition';
import { getTokenAtPosition } from './utils/getTokenAtPosition';
import loadConfig from './utils/loadConfig';
import GraphQLSchemaBuilder from './utils/GraphQLSchemaBuilder';
import watch from './utils/watch';

// import type { GraphQLNamedType } from 'graphql/type/definition';
import type {
  Hint,
  DefLocation,
  Position,
  WatchFile,
  GQLError,
} from './utils/types';

type Options = $Exact<{
  cwd?: string,
  onChange?: () => void
}>;

export class GQL {
  _isInitialized: bool = false;
  _schemaBuilder: GraphQLSchemaBuilder;

  constructor(options: ?Options) {
    const { onChange, ...configOptions } = options || {};
    const config = loadConfig(configOptions);
    this._schemaBuilder = new GraphQLSchemaBuilder(config);

    // watcher schema files
    watch(config.dir, config.schema.files, (files: Array<WatchFile>) => {
      this._schemaBuilder.updateFiles(files);
      this._isInitialized = true;
      if (onChange) { onChange(); }
    });
  }

  status(): Array<GQLError> {
    const schemaErrors = this._schemaBuilder.getSchemaErrors();
    // query errors todo
    return schemaErrors;
  }

  autocomplete(sourceText: string, position: Position): Array<Hint> {
    if (!this._isInitialized) { return []; }

    // codemirror instance
    // console.time('autocomplete');
    const results = getHintsAtPosition(
      this._schemaBuilder.getSchema(),
      sourceText,
      position,
    );
    // console.log(results);
    // console.timeEnd('autocomplete');
    return results;
  }

  getDef(sourceText: string, position: Position): ?DefLocation {
    if (!this._isInitialized) { return undefined; }

    // console.log('getDef', sourceText, position);
    // console.time('getDef');
    // console.time('getTokenAtPosition');
    const token = getTokenAtPosition(sourceText, position, true);
    // console.timeEnd('getTokenAtPosition');
    // console.log('token', token);
    if (!token) { return undefined; }

    const { state } = token;
    const schema = this._schemaBuilder.getSchema();
    if (
      state.kind === 'NamedType' ||
      (state.kind === 'UnionDef' && state.step === 4) || // union Type = Type1<-----
      (state.kind === 'UnionMember' && state.step === 1) || // union Type = Type1 | Type2<------
      (state.kind === 'Implements' && state.step === 1)
    ) {
      const name = state.name;
      const typeNode = schema.getTypeNode(name);
      if (typeNode && typeNode.loc) {
        // NOTE: type.node is undefined for graphql core types (String|Boolean ...)
        const { loc } = typeNode;
        const defLocation = {
          start: {
            line: loc.startToken.line,
            column: loc.startToken.column,
          },
          end: {
            line: loc.endToken.line,
            column: loc.endToken.column,
          },
          path: loc.source.name,
        };
        // console.timeEnd('getDef');
        return defLocation;
      }
    }
    return undefined;
  }
}
