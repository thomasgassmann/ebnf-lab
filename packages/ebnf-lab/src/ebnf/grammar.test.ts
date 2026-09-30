import { test, expect } from 'vitest';
import { Grammar, flattenImpossible, nUnit } from './grammar';

test('check-nunit', () => {
  const grammar: Grammar = {
    start: 3,
    rules: [[['A']], [['B']], [[0], [1]], [[2]]]
  };

  nUnit(grammar);

  const expectedGrammar: Grammar = {
    start: 3,
    rules: [[['A']], [['B']], [['A'], ['B']], [['A'], ['B']]]
  };

  expect(grammar).toEqual(expectedGrammar);
});

test('check-nunit-numbers', () => {
  const grammar: Grammar = {
    start: 3,
    rules: [[['1']], [['2']], [[0], [1]], [[2]]]
  };

  nUnit(grammar);

  const expectedGrammar: Grammar = {
    start: 3,
    rules: [[['1']], [['2']], [['1'], ['2']], [['1'], ['2']]]
  };

  expect(grammar).toEqual(expectedGrammar);
});

test('check-flatten-impossible', () => {
  const input: Grammar = {
    start: 0,
    rules: [[[3]], [[0, 0]], [['A']], [[1], [2]]]
  };
  const expected: Grammar = {
    start: 0,
    rules: [[[3]], [[0, 0]], [['A']], [[1], [2]]]
  };

  flattenImpossible(input);

  expect(input).toEqual(expected);
});
