import { parseChomsky } from './chomsky';

export const check = (rules: string, input: string): boolean => {
  const chomsky = parseChomsky(rules);
  return chomsky.accepts(input);
};
