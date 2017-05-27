/* @flow */
import QueryParser from 'gql-query-parser-default';
import {
  EmbeddedLanguageParser,
  getFragmentDefinitionsAtPosition,
} from 'gql-shared/GQLParser';
import { type IQueryParser, type GQLPosition } from 'gql-shared/types';
import { type ParserOptions } from './options';
import { Source } from 'graphql';

export default class EmbeddedQueryParser extends EmbeddedLanguageParser
  implements IQueryParser {
  _options: ParserOptions;

  constructor(options: ParserOptions) {
    const { start, end, ...queryParserOptions } = options;
    super({
      Parser: QueryParser(queryParserOptions),
      startMatch: start,
      endMatch: end,
    });
    this._options = options;
  }

  supportsFragmentWithoutName() {
    return this._options.allowFragmentWithoutName || false;
  }

  getFragmentDefinitionsAtPosition(
    context: $FixMe,
    source: Source,
    position: GQLPosition,
    filterByName?: string,
  ) {
    return getFragmentDefinitionsAtPosition(
      this,
      context,
      source,
      position,
      filterByName,
    );
  }
}
