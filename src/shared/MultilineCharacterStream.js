/* @flow */
export default class MultilineCharacterStream {
  _sourceText: string;
  _start: number = 0;
  _pos: number = 0;

  constructor(sourceText: string): void {
    this._sourceText = sourceText;
  }

  getStartOfToken(): number {
    return this._start;
  }

  getCurrentPosition(): number {
    return this._pos;
  }

  getRemainingText(): string {
    return this._sourceText.substring(this._pos);
  }

  _testNextCharacter(pattern: mixed) {
    const character = this._sourceText.charAt(this._pos);
    if (typeof pattern === 'string') {
      return character === pattern;
    }
    return pattern.test ? pattern.test(character) : pattern(character);
  }

  eol(): boolean {
    const char = this.peek();
    // console.log('eol', char);
    return !char || char === '\n';
  }

  sol(): boolean {
    const prevChar = this._sourceText.charAt(this._pos - 1);
    // console.log('sol', prevChar);
    return !prevChar || prevChar === '\n';
  }

  peek(): string | null {
    return this._sourceText.charAt(this._pos)
      ? this._sourceText.charAt(this._pos)
      : null;
  }

  next(): string {
    const char = this._sourceText.charAt(this._pos);
    this._pos += 1;
    return char;
  }

  eat(pattern: mixed): string | void {
    const isMatched = this._testNextCharacter(pattern);
    if (isMatched) {
      this._start = this._pos;
      this._pos += 1;
      return this._sourceText.charAt(this._pos - 1);
    }
    return undefined;
  }

  eatWhile(match: mixed): boolean {
    let isMatched = this._testNextCharacter(match);
    let didEat = false;

    // If a match, treat the total upcoming matches as one token
    if (isMatched) {
      didEat = isMatched;
      this._start = this._pos;
    }

    while (isMatched) {
      this._pos += 1;
      isMatched = this._testNextCharacter(match);
      didEat = true;
    }

    return didEat;
  }

  eatSpace(): boolean {
    return this.eatWhile(/[\s\u00a0]/);
  }

  skipToEnd(): void {
    this._pos = this._sourceText.length;
  }

  skipTo(position: number): void {
    this._pos = position;
  }

  match(
    pattern: mixed,
    consume: ?boolean = true,
    caseFold: boolean,
  ): Array<string> | boolean {
    let token = null;
    let match = null;

    switch (typeof pattern) {
      case 'string': {
        const regex = new RegExp(pattern, caseFold ? 'i' : '');
        match = regex.test(this._sourceText.substr(this._pos, pattern.length));
        token = pattern;
        break;
      }
      case 'object': // RegExp
      case 'function': {
        match = this._sourceText.slice(this._pos).match(pattern);
        token = match && match[0];
        break;
      }
      default:
        console.error('invalid type');
        break;
    }

    if (match && (typeof pattern === 'string' || match.index === 0)) {
      if (consume) {
        this._start = this._pos;
        this._pos += token.length;
      }
      return match;
    }

    // No match available.
    return false;
  }

  backUp(num: number): void {
    this._pos -= num;
  }

  column(): number {
    return this._pos;
  }

  indentation(): number {
    const match = this._sourceText.match(/\s*/);
    let indent = 0;
    if (match && match.index === 0) {
      const [whitespaces] = match;
      let pos = 0;
      while (whitespaces.length > pos) {
        if (whitespaces.charCodeAt(pos) === 9) {
          indent += 2;
        } else {
          indent += 1;
        }
        pos += 1;
      }
    }

    return indent;
  }

  current(): string {
    return this._sourceText.slice(this._start, this._pos);
  }
}
