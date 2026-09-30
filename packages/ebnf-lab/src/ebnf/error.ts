 
import { MatchInfo } from './parse';

 
export class EbnfError extends Error {}

export class ParserError extends EbnfError {
  constructor(
    public location: MatchInfo,
    public message: string
  ) {
    super(message);
  }
}

export class BundledParserError extends EbnfError {
  constructor(public errors: ParserError[]) {
    super('Errors occured!');
  }
}

export class VerifierError extends EbnfError {}
