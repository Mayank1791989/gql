/* @flow */
import { dedent } from 'dentist';
import { forEachLine } from 'gql-shared/text';

export default function code(text: string) {
  const sourceText = dedent(text);
  let position = null;
  forEachLine(sourceText, line => {
    const match = line.text.match(/--\^/);
    if (match) {
      position = {
        // $FlowDisableNextLine
        column: match.index + 3,
        line: line.number - 1,
      };
      return true;
    }
    return false;
  });

  if (!position) {
    throw new Error('Missing --^ in source');
  }

  return {
    sourceText,
    position,
  };
}
