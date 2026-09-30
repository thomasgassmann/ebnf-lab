 
/**
 * Many things from here have been taken from https://github.com/JM4ier/parsley :)
 */

import { VerifierError } from './error';
import {
  Grammar,
  NonTerminal,
  Terminal,
  normalizeGrammar,
  toGrammar
} from './grammar';
import { parse } from './parse';

export type ChomskyDefinition = Terminal | [NonTerminal, NonTerminal];
export type ChomskyRule = ChomskyDefinition[];

export class Chomsky {
   
  constructor(
    public start: NonTerminal,
    public nullable: boolean,
    public rules: ChomskyRule[]
  ) {}

  public accepts(input: string): boolean {
    const N = input.length;
    if (N === 0) {
      return this.nullable;
    }

    const p = new Array<boolean[][]>(this.rules.length);
    for (let i = 0; i < this.rules.length; i++) {
      p[i] = new Array<boolean[]>(N);
      for (let j = 0; j < N; j++) {
        p[i][j] = new Array<boolean>(N + 1);
        for (let k = 0; k < N + 1; k++) {
          p[i][j][k] = false;
        }
      }
    }

    this.rules.forEach((rule, r) => {
      rule.forEach((def) => {
        if (typeof def === 'string') {
          for (let start = 0; start < N; start++) {
            if (start + def.length > N) {
              break;
            }

            p[r][start][start + def.length] ||=
              input.substring(start, start + def.length) === def;
          }
        }
      });
    });

    for (let len = 2; len <= N; len++) {
      for (let start = 0; start < N - len + 1; start++) {
        for (let pivot = 0; pivot < len; pivot++) {
          this.rules.forEach((rule, r) => {
            for (const def of rule) {
              if (Array.isArray(def)) {
                const c1: NonTerminal = def[0];
                const c2: NonTerminal = def[1];

                p[r][start][start + len] ||=
                  p[c1][start][start + pivot] &&
                  p[c2][start + pivot][start + len];
              }
            }
          });
        }
      }
    }

    return p[this.start][0][N];
  }

  public static fromNormalized(grammar: Grammar): Chomsky {
    let nullable = false;
    const newRules = grammar.rules.map<ChomskyRule>(
      (rule, idx: NonTerminal) => {
        return rule
          .map<ChomskyDefinition | null>((definition) => {
            if (definition.length === 0) {
              if (idx === grammar.start) {
                nullable = true;
                return null;
              }
            }

            if (definition.length === 1) {
              if (typeof definition[0] === 'string') {
                return definition[0];
              }

              throw new VerifierError('Unit productions are not allowed');
            }

            if (definition.length === 2) {
              if (
                typeof definition[0] !== 'string' &&
                typeof definition[1] !== 'string'
              ) {
                return [definition[0], definition[1]];
              }

              throw new VerifierError(
                '2-token definitions must consist of two nonterminals'
              );
            }

            throw new VerifierError("rules can't contain more than two tokens");
          })
          .filter((p) => p !== null) as ChomskyRule;
      }
    );

    return new Chomsky(grammar.start, nullable, newRules);
  }
}

export const parseChomsky = (rules: string): Chomsky => {
  const parsedRules = parse(rules);
  const grammar = toGrammar(
    parsedRules,
    parsedRules[parsedRules.length - 1].name
  );
  normalizeGrammar(grammar);

  return Chomsky.fromNormalized(grammar);
};
