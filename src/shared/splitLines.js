/* @flow */
export default function splitLines(text: string): Array<string> {
  return text.split(/\r?\n|\r/);
}

export function joinLines(lines: Array<string>) {
  return lines.join('\n');
}
