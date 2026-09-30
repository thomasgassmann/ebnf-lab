import type { MatchInfo } from './parse';

export enum Token {
  RuleOpen = '<',
  RuleClose = '>',
  GroupOpen = '(',
  GroupClose = ')',
  OptionOpen = '[',
  OptionClose = ']',
  RepetitionOpen = '{',
  RepetitionClose = '}',
  Alternative = '|',
  Assignment = '<=',
  AssignmentNew = '<-',
  NewLine = '\n',
  CarriageReturn = '\r',
  Tab = '\t',
  Whitespace = ' ',
  Literal = '"'
}

const AllTokens = [
  Token.RuleOpen,
  Token.RuleClose,
  Token.GroupOpen,
  Token.GroupClose,
  Token.OptionOpen,
  Token.OptionClose,
  Token.RepetitionClose,
  Token.RepetitionOpen,
  Token.Alternative,
  Token.Assignment,
  Token.AssignmentNew,
  Token.NewLine,
  Token.Whitespace,
  Token.Literal,
  Token.CarriageReturn
];

export class Lexer {
  private readonly current: string;

  private position = 0;

  constructor(
    input: string,
    private lineNumber: number
  ) {
    this.current = input;
  }

  public getMeta(begin: number, end: number): MatchInfo {
    return {
      from: begin,
      to: end,
      line: this.lineNumber
    };
  }

  public static isToken(nextToken: string) {
    return (AllTokens as string[]).indexOf(nextToken) > -1;
  }

  public getPosition(): number {
    return this.position;
  }

  public getLineNumber(): number {
    return this.lineNumber;
  }

  public next(): Token | string {
    for (const token of AllTokens) {
      if (this.checkHasToken(token)) {
        this.consumeToken(token);
        return token;
      }
    }

    if (this.hasNext()) {
      if (!this.hasString()) {
        Lexer.throw('Expected string');
      }

      return this.nextString();
    }

    Lexer.throw('Unexpected end');
  }

  public hasNext(): boolean {
    return !this.isDone();
  }

  public isDone(): boolean {
    return this.position >= this.current.length;
  }

  public hasString(): boolean {
    for (const token of AllTokens) {
      if (this.checkHasToken(token)) {
        return false;
      }
    }

    return this.checkHasToken('');
  }

  public nextLiteral(): void {
    this.consumeToken(Token.Literal);
  }

  public hasLiteral(): boolean {
    return this.checkHasToken(Token.Literal);
  }

  public canNextUntil(token: Token): boolean {
    return this.current.substring(this.position).indexOf(token) > -1;
  }

  public nextUntil(token: Token): string {
    const begin = this.position;
    while (!this.checkHasToken(token)) {
      if (this.position >= this.current.length) {
        Lexer.throw(token);
      }

      this.position++;
    }

    return this.current.substring(begin, this.position);
  }

  public nextString(): string {
    if (!this.hasString()) {
      Lexer.throw('string');
    }

    let res = '';
    while (this.hasString()) {
      res += this.current.charAt(this.position++);
    }

    return res;
  }

  public hasWhitespace(): boolean {
    return (
      this.checkHasToken(' ') ||
      this.checkHasToken(Token.CarriageReturn) ||
      this.checkHasToken(Token.Tab)
    );
  }

  public tryNextWhitespace(): void {
    if (this.hasWhitespace()) {
      this.nextWhitespace();
    }
  }

  public nextWhitespace(): void {
    if (!this.hasWhitespace()) {
      Lexer.throw('whitespace');
    }

    while (this.hasWhitespace()) {
      this.position++;
    }
  }

  public hasAssignment(): boolean {
    return (
      this.checkHasToken(Token.Assignment) ||
      this.checkHasToken(Token.AssignmentNew)
    );
  }

  public nextAssignment(): void {
    if (this.checkHasToken(Token.Assignment)) {
      this.consumeToken(Token.Assignment);
    } else {
      this.consumeToken(Token.AssignmentNew);
    }
  }

  public hasAlternative(): boolean {
    return this.checkHasToken(Token.Alternative);
  }

  public nextAlternative(): void {
    this.consumeToken(Token.Alternative);
  }

  public hasRepetitionClose(): boolean {
    return this.checkHasToken(Token.RepetitionClose);
  }

  public nextRepetitionClose(): void {
    this.consumeToken(Token.RepetitionClose);
  }

  public hasRepetitionOpen(): boolean {
    return this.checkHasToken(Token.RepetitionOpen);
  }

  public nextRepetitionOpen(): void {
    this.consumeToken(Token.RepetitionOpen);
  }

  public hasOptionClose(): boolean {
    return this.checkHasToken(Token.OptionClose);
  }

  public nextOptionClose(): void {
    this.consumeToken(Token.OptionClose);
  }

  public hasOptionOpen(): boolean {
    return this.checkHasToken(Token.OptionOpen);
  }

  public nextOptionOpen(): void {
    this.consumeToken(Token.OptionOpen);
  }

  public hasGroupClose(): boolean {
    return this.checkHasToken(Token.GroupClose);
  }

  public nextGroupClose(): void {
    this.consumeToken(Token.GroupClose);
  }

  public hasGroupOpen(): boolean {
    return this.checkHasToken(Token.GroupOpen);
  }

  public nextGroupOpen(): void {
    this.consumeToken(Token.GroupOpen);
  }

  public hasRuleOpen(): boolean {
    return this.checkHasToken(Token.RuleOpen);
  }

  public nextRuleOpen(): void {
    this.consumeToken(Token.RuleOpen);
  }

  public hasRuleClose(): boolean {
    return this.checkHasToken(Token.RuleClose);
  }

  public nextRuleClose(): void {
    if (!this.hasRuleClose()) {
      Lexer.throw(Token.RuleClose);
    }

    this.position++;
  }

  private consumeToken(token: Token | string): void {
    if (!this.checkHasToken(token)) {
      Lexer.throw(token);
    }

    this.position += token.length;
  }

  private checkHasToken(token: Token | string): boolean {
    return (
      this.checkLength(token.length) &&
      this.current.substring(this.position, this.position + token.length) ===
        token
    );
  }

  private checkLength(length: number): boolean {
    return this.position + length - 1 < this.current.length;
  }

  private static throw(expected: string): never {
    throw new Error(`Expected ${expected}`);
  }
}
