/* @flow */
/* @babel-flow-runtime-enable */
import {
  type PkgConfig,
  type SchemaParserLoadedPkg,
  type QueryParserLoadedPkg,
} from './types';
import PkgUtils from './PkgUtils';

import { reify, Type } from 'flow-runtime';

export function loadQueryParser(
  parser: ?PkgConfig,
  extraParserOptions: $FixMe,
  pkgUtils: PkgUtils,
): QueryParserLoadedPkg {
  return pkgUtils.load({
    prefix: 'gql-query-parser',
    pkgConfig: parser || 'default',
    extraPkgOptions: extraParserOptions,
    corePkgs: ['gql-query-parser-default', 'gql-query-parser-embedded-queries'],
    validate(parserModule): QueryParserLoadedPkg {
      // const ParserType = (reify: Type<QueryParserLoadedPkg>);
      // ParserType.assert(parserModule);
      return (parserModule: $FixMe);
    },
  });
}

export function loadSchemaParser(
  parser: ?PkgConfig,
  extraParserOptions: $FixMe,
  pkgUtils: PkgUtils,
): SchemaParserLoadedPkg {
  return pkgUtils.load({
    prefix: 'gql-schema-parser',
    pkgConfig: parser || 'default',
    corePkgs: ['gql-schema-parser-default'],
    extraPkgOptions: extraParserOptions,
    validate(parserModule): SchemaParserLoadedPkg {
      // const ParserType = (reify: Type<SchemaParserLoadedPkg>);
      // ParserType.assert(parserModule);
      return (parserModule: $FixMe);
    },
  });
}

// export function loadResolverParser(
//   parser: ParserPkg,
//   configPath: string,
// ): [Class<IResolverParser>, Options] {
//   return loadParser({
//     parser,
//     prefix: 'gql-resolver-parser',
//     coreParsers: [],
//     configPath,
//     validate(parserModule): Class<IResolverParser> {
//       const ParserType = (reify: Type<IResolverParser>);
//       ParserType.assert(parserModule);
//       return (parserModule: $FixMe);
//     },
//   });
// }

// function loadParser<
//   TParser: IQueryParser | ISchemaParser | IResolverParser,
// >(params: {
//   parser: ParserPkg,
//   prefix: string,
//   configPath: string,
//   coreParsers: Array<string>,
//   validate: (parserModule: mixed) => Class<TParser>,
// }): [Class<TParser>, Options] {
//   const [parserPkg, options] = normalizePkgConfig(params.prefix, params.parser);

//   const [pkg, dir] = params.coreParsers.includes(parserPkg)
//     ? [`./${parserPkg}`, GQL_MODULE_DIR]
//     : [parserPkg, params.configPath];

//   try {
//     const parserModule = importModule(pkg, dir);
//     const parser = params.validate(parserModule);
//     return [parser, options];
//   } catch (err) {
//     if (err.code === 'MODULE_NOT_FOUND') {
//       throw new Error(
//         `PARSER_PKG_NOT_FOUND: Parser '${pkg}' not found relative to '${dir}'`,
//       );
//     }

//     if (err.name === 'RuntimeTypeError') {
//       throw new Error(
//         `PARSER_PKG_INVALID: There are errors in parser '${pkg}'\n\n${
//           err.message
//         }`,
//       );
//     }

//     throw err;
//   }
// }
