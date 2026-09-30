/**
 * Many things from here have been taken from https://github.com/JM4ier/parsley :)
 */

 
/* eslint-disable no-case-declarations */
import { EbnfRule, Match, MatchType } from './parse';

export type NonTerminal = number;
export type Terminal = string;

export type Token = Terminal | NonTerminal;

export type Definition = Token[];

export type Rule = Definition[];

export type Grammar = {
  start: NonTerminal;
  rules: Rule[];
};

const addRuleToGrammar = (grammar: Grammar, rule: Rule): NonTerminal => {
  grammar.rules.push(rule);
  return grammar.rules.length - 1;
};

export const toGrammar = (ebnfRules: EbnfRule[], ruleName: string): Grammar => {
  const rules: Rule[] = [];
  // rule name to NonTerminal
  const lookup = new Map<string, NonTerminal>();

  const addRule = (rule: Rule): NonTerminal => {
    return addRuleToGrammar({ rules, start: 0 }, rule);
  };

  const convert = (match: Match): NonTerminal => {
    switch (match.type) {
      case MatchType.Rule:
        if (!lookup.has(match.ruleName)) {
          const nt = addRule([]);
          lookup.set(match.ruleName, nt);
          return nt;
        }

        return lookup.get(match.ruleName)!;
      case MatchType.Static:
        return addRule([[match.match]]);
      case MatchType.Option:
        const parts: Rule = [[addRule([[]])], [convert(match.option)]];
        return addRule(parts);
      case MatchType.Selection:
        const selectionParts = match.options.map((p) => [convert(p)]);
        return addRule(selectionParts);
      case MatchType.Repetition:
        const part = convert(match.inner);
        const createdRule = addRule([]);
        rules[createdRule].push([]);
        rules[createdRule].push([createdRule, createdRule]);
        rules[createdRule].push([part]);
        return createdRule;
      case MatchType.Sequence:
        const seqParts = match.sequence.map((p) => convert(p));
        return addRule([seqParts]);
      default:
        throw new Error(`Unknown match type`);
    }
  };

  for (const ebnfRule of ebnfRules) {
    const nt = convert(ebnfRule.match);
    if (lookup.has(ebnfRule.name)) {
      rules[lookup.get(ebnfRule.name)!].push([nt]);
    } else {
      lookup.set(ebnfRule.name, nt);
    }
  }

  return {
    start: lookup.has(ruleName) ? lookup.get(ruleName)! : addRule([]),
    rules
  };
};

const concatenateStrings = (grammar: Grammar) => {
  for (let i = 0; i < grammar.rules.length; i++) {
    for (let j = 0; j < grammar.rules[i].length; j++) {
      let acc: Terminal = '';
      const newDefinition: Definition = [];
      for (const token of grammar.rules[i][j]) {
        if (typeof token === 'string') {
          acc += token;
        } else {
          newDefinition.push(acc);
          acc = '';
          newDefinition.push(token);
        }
      }

      newDefinition.push(acc);
      grammar.rules[i][j] = newDefinition;
    }
  }
};

const removeEmptyStrings = (grammar: Grammar) => {
  for (let i = 0; i < grammar.rules.length; i++) {
    for (let j = 0; j < grammar.rules[i].length; j++) {
      grammar.rules[i][j] = grammar.rules[i][j].filter(
        (p) => Number.isInteger(p) || (typeof p === 'string' && p.length > 0)
      );
    }
  }
};

const compareDefinitions = (a: Definition, b: Definition): number => {
  if (a.length !== b.length) {
    return a.length - b.length;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      if (typeof a[i] !== typeof b[i]) {
        return typeof a[i] === 'string' ? -1 : 1;
      }

      return typeof a[i] === 'string'
        ? (a[i] as string).localeCompare(b[i] as string)
        : (a[i] as number) - (b[i] as number);
    }
  }

  return 0;
};

const dedupRule = (rule: Rule): void => {
  rule.sort((a, b) => compareDefinitions(a, b));
  for (let i = 0; i < rule.length - 1; i++) {
    if (compareDefinitions(rule[i], rule[i + 1]) === 0) {
      rule.splice(i, 1);
      i--;
    }
  }
};

 
const dedup = (grammar: Grammar) => {
  for (const rule of grammar.rules) {
    dedupRule(rule);
  }
};

const removeCycles = (grammar: Grammar) => {
  for (let i = 0; i < grammar.rules.length; i++) {
    grammar.rules[i] = grammar.rules[i].filter(
      (p) => !(p.length === 1 && p[0] === i)
    );
  }
};

export const flattenImpossible = (grammar: Grammar) => {
  const isPossible = (
    rules: Rule[],
    nt: NonTerminal,
    visited: boolean[]
  ): boolean => {
    if (visited[nt]) {
      return false;
    }

    visited[nt] = true;
    for (const definition of rules[nt]) {
      if (
        definition.every(
          (p) => typeof p === 'string' || isPossible(rules, p, visited)
        )
      ) {
        visited[nt] = false;
        return true;
      }
    }

    visited[nt] = false;
    return false;
  };

  const possible: boolean[] = new Array(grammar.rules.length);
  for (let i = 0; i < grammar.rules.length; i++) {
    possible[i] = isPossible(grammar.rules, i, new Array(grammar.rules.length));
  }

  for (let i = 0; i < grammar.rules.length; i++) {
    if (!possible[i]) {
      grammar.rules[i] = [];
    }
  }
};

const removeUnreachable = (grammar: Grammar) => {
  const reachable = new Array<boolean>(grammar.rules.length);
  const q: NonTerminal[] = [];

  reachable[grammar.start] = true;
  q.push(grammar.start);

  while (q.length > 0) {
    const top = q.pop()!;
    for (const definition of grammar.rules[top]) {
      for (const token of definition) {
        if (typeof token !== 'string' && !reachable[token]) {
          reachable[token] = true;
          q.push(token);
        }
      }
    }
  }

  const offsets = new Array<number>(grammar.rules.length);
  let offset = 0;
  for (let i = 0; i < grammar.rules.length; i++) {
    if (reachable[i]) {
      offsets[i] = offset++;
    }
  }

  const newRules = new Array(offset);
  for (let i = 0; i < grammar.rules.length; i++) {
    if (reachable[i]) {
      newRules[offsets[i]] = grammar.rules[i].map((x) =>
        [...x].map((p) => (typeof p === 'string' ? p : offsets[p]))
      );
    }
  }

  grammar.rules = newRules;
  grammar.start = offsets[grammar.start];
};

// adds new starting point to avoid any rule producing the starting nonterminal
const nStart = (grammar: Grammar): void => {
  const newStart: Rule = [[grammar.start]];
  grammar.start = addRuleToGrammar(grammar, newStart);
};

// puts every terminal into its own definition
const nTerm = (grammar: Grammar): void => {
  for (let i = 0; i < grammar.rules.length; i++) {
    for (let j = 0; j < grammar.rules[i].length; j++) {
      if (grammar.rules[i][j].length < 2) {
         
        continue;
      }

      for (let k = 0; k < grammar.rules[i][j].length; k++) {
        if (typeof grammar.rules[i][j][k] === 'string') {
          const terminal: Terminal = grammar.rules[i][j][k] as string;
          const newRule: Rule = [[terminal]];
          const newRuleNonTerminal = addRuleToGrammar(grammar, newRule);
          grammar.rules[i][j][k] = newRuleNonTerminal;
        }
      }
    }
  }
};

// breaks up any definition that contains more than two tokens
export const nBin = (grammar: Grammar): void => {
  for (let i = 0; i < grammar.rules.length; i++) {
    for (let j = 0; j < grammar.rules[i].length; j++) {
      const defLength = grammar.rules[i][j].length;
      if (defLength <= 2) {
         
        continue;
      }

      let f = addRuleToGrammar(grammar, [
        [grammar.rules[i][j][defLength - 2], grammar.rules[i][j][defLength - 1]]
      ]);
      let k = defLength - 2;
      while (k > 1) {
        k--;
        const x = grammar.rules[i][j][k];
        f = addRuleToGrammar(grammar, [[x, f]]);
      }

      grammar.rules[i][j] = [grammar.rules[i][j][0], f];
    }
  }
};

// eliminates all null productions from any nonterminal except the start
export const nDel = (grammar: Grammar): void => {
  // stores whether non-terminal can produce empty string
  const nullable = new Array<boolean>(grammar.rules.length);

  // look up which nonterminals depend on the i-th nonterminal
  const rev = new Array<Set<NonTerminal>>(grammar.rules.length);
  for (let i = 0; i < rev.length; i++) {
    rev[i] = new Set<NonTerminal>();
  }

  for (let i = 0; i < grammar.rules.length; i++) {
    for (const token of grammar.rules[i].flatMap((p) => p)) {
      if (typeof token !== 'string') {
        rev[token].add(i);
      }
    }
  }

  // mark trivially nullable nonterminals as nullable
  const q: NonTerminal[] = [];
  for (let i = 0; i < grammar.rules.length; i++) {
    const rule = grammar.rules[i];
    if (rule.some((p) => p.length === 0)) {
      // there is at least one definition containing no tokens, i.e. that definition
      // produces the empty string
      nullable[i] = true;

      for (const dep of rev[i].values()) {
        q.push(dep);
      }
    }
  }

  while (q.length > 0) {
    const idx = q.pop()!;
    if (nullable[idx]) {
       
      continue;
    }

    // if all tokens in one definition are nullable, then this nonterminal is also nullable
    const canNull = grammar.rules[idx].some((def) =>
      def.every((token) =>
        typeof token === 'string' ? false : nullable[token]
      )
    );

    if (canNull) {
      nullable[idx] = true;
      for (const next of rev[idx].values()) {
        if (!nullable[next]) {
          q.push(next);
        }
      }
    }
  }

  // after finding all nullable nonterminals, eliminate null productions everywhere except
  // the start
  for (let i = 0; i < grammar.rules.length; i++) {
    const rule = grammar.rules[i];
    const newDefs: Definition[] = [];
    for (const def of rule) {
      // indices of nullable nonterminals in the definition
      const nulls: NonTerminal[] = [];
      for (let k = 0; k < def.length; k++) {
        if (typeof def[k] !== 'string' && nullable[def[k] as NonTerminal]) {
          nulls.push(k);
        }
      }

      // find all possible combinations of leaving out nullable nonterminals and add as
      // new definitions
       
      for (let k = 0; k < (1 << nulls.length) - 1; k++) {
        const newDef = [...def];
        for (let j = nulls.length - 1; j >= 0; j--) {
           
          if (((1 << j) & k) === 0) {
            newDef.splice(nulls[j], 1);
          }
        }

        newDefs.push(newDef);
      }
    }

    // add new rule combinations to the actual rule and remove duplicates
    rule.push(...newDefs);
    dedupRule(rule);

    // remove null productions unless it is the starting rule
    if (i !== grammar.start) {
      grammar.rules[i] = grammar.rules[i].filter((p) => p.length !== 0);
    }
  }
};

// eliminates all unit productions of the form `A -> B` by adding the definitions of `B` to `A`
export const nUnit = (grammar: Grammar): void => {
  for (let r = 0; r < grammar.rules.length; r++) {
    let i = 0;
    const removal: NonTerminal[] = [];
    while (i < grammar.rules[r].length) {
      if (grammar.rules[r][i].length === 1) {
        if (typeof grammar.rules[r][i][0] !== 'string') {
          const nt = grammar.rules[r][i][0] as NonTerminal;
          for (const def of grammar.rules[nt]) {
            if (
              !grammar.rules[r].some((ri) => compareDefinitions(ri, def) === 0)
            ) {
              grammar.rules[r].push(def);
            }
          }

          removal.push(i);
        }
      }

      i++;
    }

    for (const k of removal.reverse()) {
      grammar.rules[r].splice(k, 1);
    }
  }
};

export const simplifyGrammar = (grammar: Grammar): void => {
  concatenateStrings(grammar);
  removeEmptyStrings(grammar);
  dedup(grammar);
  removeCycles(grammar);
  flattenImpossible(grammar);
  removeUnreachable(grammar);
};

export const normalizeGrammar = (grammar: Grammar): void => {
  simplifyGrammar(grammar);
  nStart(grammar);
  nTerm(grammar);
  nBin(grammar);
  nDel(grammar);
  removeCycles(grammar);
  nUnit(grammar);
  simplifyGrammar(grammar);
};
