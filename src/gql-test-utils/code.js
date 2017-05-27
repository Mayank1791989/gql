/* @flow */
import { dedent } from 'dentist';
import splitLines from 'gql-shared/splitLines';

export default function code(text: string) {
  const sourceText = dedent(text);
  const lines = splitLines(sourceText);
  let position = null;
  lines.forEach((line, index) => {
    const match = line.match(/--\^/);
    if (match) {
      position = {
        // $FlowDisableNextLine
        column: match.index + 3,
        line: index,
      };
    }
  });

  if (!position) {
    throw new Error('Missing --^ in source');
  }

  return {
    sourceText,
    position,
  };
}
