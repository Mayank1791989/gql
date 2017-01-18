/* @flow */
import QueryParser from './QueryParser';
import EmbeddedLanguageParser from '../../../shared/EmbeddedLanguageParser';

type Options = {
  startTag: string,
  endTag: string,
};

class EmbeddedQueryParser extends EmbeddedLanguageParser {
  constructor({ startTag, endTag }: Options) {
    super({ Parser: QueryParser, startMatch: startTag, endMatch: endTag });
  }
}

export default EmbeddedQueryParser;
