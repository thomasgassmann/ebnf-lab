 
/* eslint-disable no-case-declarations */
import { BundledParserError, ParserError } from './error';
import { Lexer, Token } from './lex';

export enum MatchType {
  Static = 'static',
  Rule = 'rule',
  Option = 'option',
  Selection = 'selection',
  Repetition = 'repetition',
  Sequence = 'sequence'
}

export type MatchInfo = {
  line: number;
  from: number;
  to: number;
};

export type Match =
   
  | OptionMatch
   
  | RepetitionMatch
   
  | SequenceMatch
   
  | StaticMatch
   
  | SelectionMatch
   
  | RuleMatch;

export type MatchCommon = {
  type: MatchType;
  meta: MatchInfo;
};

export type EbnfRule = {
  meta: MatchInfo;
  name: string;
  match: Match;
};

// precedence: Sequence, only then Selection

// e.g. rule1 <= hi there
export type StaticMatch = MatchCommon & {
  type: MatchType.Static;
  match: string;
};

// e.g. rule1 <= <a>
export type RuleMatch = MatchCommon & {
  type: MatchType.Rule;
  ruleName: string;
};

// e.g. rule1 <= [<a>]
export type OptionMatch = MatchCommon & {
  type: MatchType.Option;
  option: Match;
};

// e.g. rule1 <= <a> | <b> | <c>
export type SelectionMatch = MatchCommon & {
  type: MatchType.Selection;
  options: Match[];
};

// e.g. rule1 <= {<a>}
export type RepetitionMatch = MatchCommon & {
  type: MatchType.Repetition;
  inner: Match;
};

// e.g. rule1 <= <a> <b> <c>
export type SequenceMatch = MatchCommon & {
  type: MatchType.Sequence;
  sequence: Match[];
};

const expect = (
  lexer: Lexer,
  expectation: (lexer: Lexer) => boolean,
  ...token: string[]
) => {
  if (!expectation(lexer)) {
    throw new ParserError(
      {
        from: lexer.getPosition(),
        line: lexer.getLineNumber(),
        to: lexer.getPosition() + 1
      },
      `Expected: ${token.join(', ')}`
    );
  }
};

export const parseMatch = (lexer: Lexer, closing?: Token): Match => {
  const beginOuter = lexer.getPosition();

  const selections: Match[] = [];
  let current: Match[] = [];
  let isSelection = false;

  let currentBegin = -1;
  let selectionBegin = -1;

  let expectAlternative = false;
  let lastAlternativeIndex = -1;

  const pushCurrent = (prev: number, match: Match) => {
    if (currentBegin < 0) {
      currentBegin = prev;
    }

    current.push(match);
  };

  const withMeta = <T>(token: string, fn: () => T): [MatchInfo, T] => {
    const begin = lexer.getPosition() + 1;
    const inner = fn();
    const end = lexer.getPosition() + 1;
    return [lexer.getMeta(begin - token.length, end), inner];
  };

  const addSelectionOption = () => {
    isSelection = true;
    selectionBegin = currentBegin;
    if (current.length === 1) {
      selections.push(current[0]);
    } else {
      selections.push({
        type: MatchType.Sequence,
        sequence: current,
        meta: lexer.getMeta(currentBegin, lexer.getPosition())
      });
    }

    current = [];
    currentBegin = -1;
  };

  const ret = (): Match => {
    if (isSelection && expectAlternative && current.length === 0) {
      throw new ParserError(
        {
          from: lastAlternativeIndex + 1,
          line: lexer.getLineNumber(),
          to: lexer.getPosition() + 1
        },
        `Expected another alternative`
      );
    }

    if (current.length !== 0 && isSelection) {
      addSelectionOption();
    }

    if (isSelection) {
      return {
        type: MatchType.Selection,
        options: selections,
        meta: lexer.getMeta(selectionBegin, lexer.getPosition())
      };
    }

    if (current.length === 1) {
      return current[0];
    }

    return {
      type: MatchType.Sequence,
      sequence: current,
      meta: lexer.getMeta(currentBegin, lexer.getPosition())
    };
  };

  while (lexer.hasNext()) {
    const prev = lexer.getPosition();
    const nextToken = lexer.next();
    switch (nextToken) {
      case Token.RuleOpen:
        const [ruleMeta, ruleName] = withMeta(Token.RuleOpen, () => {
          expect(lexer, (l) => l.hasString(), 'rule name');
          const r = lexer.nextString();
          expect(lexer, (l) => l.hasRuleClose(), Token.RuleClose);
          lexer.nextRuleClose();
          return r;
        });
        pushCurrent(prev, {
          type: MatchType.Rule,
          ruleName,
          meta: ruleMeta
        });
        break;
      case Token.GroupOpen:
        pushCurrent(prev, parseMatch(lexer, Token.GroupClose));
        break;
      case Token.OptionOpen:
        const [optionMeta, option] = withMeta(Token.OptionOpen, () =>
          parseMatch(lexer, Token.OptionClose)
        );
        pushCurrent(prev, {
          type: MatchType.Option,
          option,
          meta: optionMeta
        });
        break;
      case Token.RepetitionOpen:
        const [meta, inner] = withMeta(Token.RepetitionOpen, () =>
          parseMatch(lexer, Token.RepetitionClose)
        );
        pushCurrent(prev, {
          type: MatchType.Repetition,
          inner,
          meta
        });
        break;
      case Token.Alternative:
        lastAlternativeIndex = prev;
        expectAlternative = true;
        addSelectionOption();
        break;
      case Token.Whitespace:
      case Token.CarriageReturn:
        break;
      case Token.Literal:
        const [literalMeta, literal] = withMeta(Token.Literal, () => {
          expect(lexer, (l) => l.canNextUntil(Token.Literal), Token.Literal);
          const res = lexer.nextUntil(Token.Literal);
          lexer.nextLiteral();
          return res;
        });
        pushCurrent(prev, {
          type: MatchType.Static,
          match: literal,
          meta: literalMeta
        });
        break;
      default:
        if (nextToken === closing) {
          return ret();
        }

        if (Lexer.isToken(nextToken)) {
          throw new ParserError(
            {
              from: lexer.getPosition(),
              line: lexer.getLineNumber(),
              to: lexer.getPosition() + nextToken.length
            },
            `Unxpected ${nextToken}`
          );
        }

        current.push({
          type: MatchType.Static,
          match: nextToken,
          meta: {
            line: lexer.getLineNumber(),
            from: lexer.getPosition() - nextToken.length,
            to: lexer.getPosition()
          }
        });
        break;
    }
  }

  if (closing) {
    throw new ParserError(
      {
        from: beginOuter,
        to: lexer.getPosition() + closing.length,
        line: lexer.getLineNumber()
      },
      `Expected ${closing}`
    );
  }

  return ret();
};

export const parseRule = (lexer: Lexer): EbnfRule => {
  if (lexer.hasWhitespace()) {
    lexer.nextWhitespace();
  }

  const begin = lexer.getPosition();

  expect(lexer, (l) => l.hasRuleOpen(), Token.RuleOpen);
  lexer.nextRuleOpen();
  expect(lexer, (l) => l.hasString(), 'rule name');
  const name = lexer.nextString();
  expect(lexer, (l) => l.hasRuleClose(), Token.RuleClose);
  lexer.nextRuleClose();

  const end = lexer.getPosition() + 1;

  expect(lexer, (l) => l.hasWhitespace(), 'whitespace');
  lexer.nextWhitespace();

  expect(
    lexer,
    (l) => l.hasAssignment(),
    Token.Assignment,
    Token.AssignmentNew
  );

  lexer.nextAssignment();

  expect(lexer, (l) => l.hasWhitespace(), 'whitespace');
  lexer.nextWhitespace();

  return {
    name,
    match: parseMatch(lexer),
    meta: {
      line: lexer.getLineNumber(),
      from: begin,
      to: end
    }
  };
};

const validateName = (
  ruleName: string,
  meta: MatchInfo
): ParserError | null => {
  const invalid = new ParserError(
    meta,
    `Rule name ${ruleName} must be non-empty, not contain whitespace and not contain '='`
  );
  if (ruleName.includes(' ')) {
    return invalid;
  }

  return !!ruleName && !ruleName.includes('=') ? null : invalid;
};

const validateRuleName = (
  ruleName: string,
  meta: MatchInfo,
  validRules: Set<string>
) => {
  const res: ParserError[] = [];
  if (!validRules.has(ruleName)) {
    res.push(new ParserError(meta, `Rule ${ruleName} does not exist`));
  }

  const nameError = validateName(ruleName, meta);
  if (nameError !== null) {
    res.push(nameError);
  }

  return res;
};

const validateRuleNames = (
  input: Match,
  validRules: Set<string>
): ParserError[] => {
  switch (input.type) {
    case MatchType.Rule:
      return validateRuleName(input.ruleName, input.meta, validRules);
    case MatchType.Option:
      return validateRuleNames(input.option, validRules);
    case MatchType.Repetition:
      return validateRuleNames(input.inner, validRules);
    case MatchType.Selection:
    case MatchType.Sequence:
      const res: ParserError[] = [];
      for (const option of input.type === MatchType.Sequence
        ? input.sequence
        : input.options) {
        res.push(...validateRuleNames(option, validRules));
      }

      return res;
    default:
      return [];
  }
};

export const parse = (input: string): EbnfRule[] => {
  const lines = input.split(Token.NewLine);
  const rules: EbnfRule[] = [];
  let lineNumber = 0;
  const errors: ParserError[] = [];
  const ruleNames = new Set<string>();
  const duplicateRuleNames = new Set<string>();
  for (const line of lines) {
    lineNumber++;

    if (line.trim() === '') {
      continue;
    }

    if (line.trim().startsWith('#')) {
      // skip comments
      continue;
    }

    try {
      const lexer = new Lexer(line, lineNumber);
      const rule = parseRule(lexer);

      rules.push(rule);

      if (
        rule.match.type === MatchType.Sequence &&
        rule.match.sequence.length === 0
      ) {
        throw new ParserError(rule.meta, 'Expected non-empty rule');
      }

      if (ruleNames.has(rule.name)) {
        duplicateRuleNames.add(rule.name);
      }

      ruleNames.add(rule.name);
    } catch (err) {
      if (err instanceof ParserError) {
        errors.push(err);
      }
    }
  }

  for (const rule of rules) {
    errors.push(...validateRuleNames(rule.match, ruleNames));
    if (duplicateRuleNames.has(rule.name)) {
      errors.push(new ParserError(rule.meta, `Duplicate rule ${rule.name}`));
    }

    const nameError = validateName(rule.name, rule.meta);
    if (nameError !== null) {
      errors.push(nameError);
    }
  }

  if (errors.length > 0) {
    throw new BundledParserError(errors);
  }

  return rules;
};
