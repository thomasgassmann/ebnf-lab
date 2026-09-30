import { test, expect } from 'vitest';
import { check } from './verifier';

test('xygemisch-newsyntax', () => {
  const rules = '<x2ygemisch> <- {X <x2ygemisch> YY | YY <x2ygemisch> X}';

  expect(!check(rules, 'YX')).toBeTruthy();
  expect(check(rules, '')).toBeTruthy();
  expect(!check(rules, 'YXY')).toBeTruthy();
  expect(check(rules, 'YYX')).toBeTruthy();
  expect(check(rules, 'XYYYYYYXXYYX')).toBeTruthy();
  expect(!check(rules, 'XYYYXYYYYXYYXYYXYYX')).toBeTruthy();
  expect(!check(rules, 'YYXY')).toBeTruthy();
  expect(check(rules, 'YYYYXXYYX')).toBeTruthy();
  expect(check(rules, 'XXXYYYYXYYYY')).toBeTruthy();
  expect(check(rules, 'XXXYYYYXYYXXXYYYYXYYYYYY')).toBeTruthy();
  expect(check(rules, 'XYYYYX')).toBeTruthy();
  expect(!check(rules, 'XYYYXYYYXYYXYYXYYX')).toBeTruthy();
  expect(check(rules, 'XXYYYY')).toBeTruthy();
  expect(check(rules, 'XYY')).toBeTruthy();
  expect(!check(rules, 'XYYYXYYYYXYYXYYXXYYYXYYYYXYYXYYXYYXYYX')).toBeTruthy();
  expect(!check(rules, 'XYYYXYYYXYYXYYXYYXYYYXYYYXYYXYYXYYXX')).toBeTruthy();
  expect(
    !check(
      rules,
      'XXYYYXYYYXYYXYYXYYXYYYXYYYXYYXYYXYYXXYYYXYYYXYYXYYXYYXYYYXYYYXYYXYYXYYXX'
    )
  ).toBeTruthy();
  expect(
    !check(
      rules,
      'XXXXYYYXYYYXYYXYYXYYXYYYXYYYXYYXYYXYYXXYYYXYYYXYYXYYXYYXYYYXYYYXYYXYYXYYXXYYYXYYYXYYXYYXYYXYYYXYYYXYYXYYXYYXXYYYXYYYXYYXYYXYYXYYYXYYYXYYXYYXYYXX'
    )
  ).toBeTruthy();
  expect(
    check(rules, 'XXXYYYYXYYXXXYYYYXYYYYXXXYYYYXYYXXXYYYYXYYYYYYYY')
  ).toBeTruthy();
  expect(
    check(rules, 'XXXYYYYXYYXXXYYXYYXYYYYXXXYYYYXYYXYYXXYYYYXYYYYYYYY')
  ).toBeTruthy();
  expect(
    check(
      rules,
      'XXXYYYYXYYXXXYYXYYXYYXYYYYYYXXYYXYYXXXYYYYXYYXYYXXYYYYXYYYYYYYY'
    )
  ).toBeTruthy();
});

test('xygemisch', () => {
  const rules = '<x2ygemisch> <= {X <x2ygemisch> YY | YY <x2ygemisch> X}';

  expect(!check(rules, 'YX')).toBeTruthy();
  expect(check(rules, '')).toBeTruthy();
  expect(!check(rules, 'YXY')).toBeTruthy();
  expect(check(rules, 'YYX')).toBeTruthy();
  expect(check(rules, 'XYYYYYYXXYYX')).toBeTruthy();
  expect(!check(rules, 'XYYYXYYYYXYYXYYXYYX')).toBeTruthy();
  expect(!check(rules, 'YYXY')).toBeTruthy();
  expect(check(rules, 'YYYYXXYYX')).toBeTruthy();
  expect(check(rules, 'XXXYYYYXYYYY')).toBeTruthy();
  expect(check(rules, 'XXXYYYYXYYXXXYYYYXYYYYYY')).toBeTruthy();
  expect(check(rules, 'XYYYYX')).toBeTruthy();
  expect(!check(rules, 'XYYYXYYYXYYXYYXYYX')).toBeTruthy();
  expect(check(rules, 'XXYYYY')).toBeTruthy();
  expect(check(rules, 'XYY')).toBeTruthy();
  expect(!check(rules, 'XYYYXYYYYXYYXYYXXYYYXYYYYXYYXYYXYYXYYX')).toBeTruthy();
  expect(!check(rules, 'XYYYXYYYXYYXYYXYYXYYYXYYYXYYXYYXYYXX')).toBeTruthy();
  expect(
    !check(
      rules,
      'XXYYYXYYYXYYXYYXYYXYYYXYYYXYYXYYXYYXXYYYXYYYXYYXYYXYYXYYYXYYYXYYXYYXYYXX'
    )
  ).toBeTruthy();
  expect(
    !check(
      rules,
      'XXXXYYYXYYYXYYXYYXYYXYYYXYYYXYYXYYXYYXXYYYXYYYXYYXYYXYYXYYYXYYYXYYXYYXYYXXYYYXYYYXYYXYYXYYXYYYXYYYXYYXYYXYYXXYYYXYYYXYYXYYXYYXYYYXYYYXYYXYYXYYXX'
    )
  ).toBeTruthy();
  expect(
    check(rules, 'XXXYYYYXYYXXXYYYYXYYYYXXXYYYYXYYXXXYYYYXYYYYYYYY')
  ).toBeTruthy();
  expect(
    check(rules, 'XXXYYYYXYYXXXYYXYYXYYYYXXXYYYYXYYXYYXXYYYYXYYYYYYYY')
  ).toBeTruthy();
  expect(
    check(
      rules,
      'XXXYYYYXYYXXXYYXYYXYYXYYYYYYXXYYXYYXXXYYYYXYYXYYXXYYYYXYYYYYYYY'
    )
  ).toBeTruthy();
});

test('option', () => {
  const rule = '<test> <= [A]';

  expect(check(rule, 'A')).toBeTruthy();
  expect(check(rule, '')).toBeTruthy();
  expect(check(rule, 'B')).toBeFalsy();
});

test('sequence', () => {
  const rule = '<test> <= ({<test>} A)';

  expect(check(rule, '')).toBeFalsy();
  expect(check(rule, 'A')).toBeTruthy();
  expect(check(rule, 'AA')).toBeTruthy();
  expect(check(rule, 'AAAAAAAA')).toBeTruthy();
});

test('start-sequence', () => {
  const rule = '<test> <= (A {<test>} A)';

  expect(check(rule, '')).toBeFalsy();
  expect(check(rule, 'AA')).toBeTruthy();
  expect(check(rule, 'AA')).toBeTruthy();
  expect(check(rule, 'AAAAAAAA')).toBeTruthy();
  expect(check(rule, 'AAAAAAAAA')).toBeFalsy();
});

test('selection', () => {
  const rule = '<rule> <= A | B';

  expect(check(rule, 'A')).toBeTruthy();
  expect(check(rule, 'B')).toBeTruthy();
  expect(check(rule, 'C')).toBeFalsy();
  expect(check(rule, '')).toBeFalsy();
});

test('strings', () => {
  const rule = '<rule> <= "test abd"';

  expect(check(rule, 'test abd')).toBeTruthy();
  expect(check(rule, 'test abdtest abd')).toBeFalsy();

  const nested = '<rule> <= ""test abd""';

  expect(check(nested, 'testabd')).toBeTruthy();
  expect(check(nested, 'test abd')).toBeFalsy();

  const invalid = '<rule> <= ""test abd"';

  expect(() => check(invalid, '')).toThrow();

  const invalidEnd = '<rule> <= "test abd""';

  expect(() => check(invalidEnd, '')).toThrow();
});

test('numbers', () => {
  const rule = '<number> <= 1';

  expect(check(rule, '1')).toBeTruthy();
  expect(check(rule, '0')).toBeFalsy();
  expect(check(rule, '')).toBeFalsy();
});

test('selection-number', () => {
  const rule = '<rule> <= 1 | 2';

  expect(check(rule, '1')).toBeTruthy();
  expect(check(rule, '2')).toBeTruthy();
  expect(check(rule, '')).toBeFalsy();
  expect(check(rule, '3')).toBeFalsy();
});

test('single-rule', () => {
  const rules = '<two> <= {1 | 3 | 5}';

  expect(check(rules, '')).toBeTruthy();
  expect(check(rules, '1')).toBeTruthy();
  expect(check(rules, '135')).toBeTruthy();
});

test('multi-rule', () => {
  const rules = '<one> <= A | B\n<two> <= {<one>}';

  expect(check(rules, '')).toBeTruthy();
  expect(check(rules, 'A')).toBeTruthy();
  expect(check(rules, 'AB')).toBeTruthy();
  expect(check(rules, 'ABAAA')).toBeTruthy();
  expect(check(rules, 'ABA AA')).toBeFalsy();
});

test('multi-rule-number', () => {
  const rules = '<one> <= 1 | 3 | 5\n<two> <= {<one>}';

  expect(check(rules, '')).toBeTruthy();
  expect(check(rules, '1')).toBeTruthy();
  expect(check(rules, '135')).toBeTruthy();
});

test('seq-1', () => {
  const rule = '<test> <= 1 | 2\n<rule> <= <test>';

  expect(check(rule, '1')).toBeTruthy();
  expect(check(rule, '2')).toBeTruthy();
  expect(check(rule, '')).toBeFalsy();
  expect(check(rule, '212')).toBeFalsy();
});

test('seq-2', () => {
  const rule = '<test> <= 1 | 2\n<rule> <= <test> <test>';

  expect(check(rule, '11')).toBeTruthy();
  expect(check(rule, '12')).toBeTruthy();
  expect(check(rule, '21')).toBeTruthy();
  expect(check(rule, '22')).toBeTruthy();
  expect(check(rule, '')).toBeFalsy();
  expect(check(rule, '1')).toBeFalsy();
  expect(check(rule, '2')).toBeFalsy();
  expect(check(rule, '212')).toBeFalsy();
});

test('seq-3', () => {
  const rule = '<rule> <= <rule> <rule> | A';

  expect(check(rule, 'AA')).toBeTruthy();
  expect(check(rule, 'A')).toBeTruthy();
  expect(check(rule, '')).toBeFalsy();
  expect(check(rule, 'AAA')).toBeTruthy();
  expect(check(rule, 'AAAA')).toBeTruthy();
});

test('non-empty', () => {
  const rule = '<test> <= ABC | CDE | (<test> <test>)';

  expect(check(rule, '')).toBeFalsy();
  expect(check(rule, 'ABC')).toBeTruthy();
  expect(check(rule, 'CDE')).toBeTruthy();
  expect(check(rule, 'ABCCDE')).toBeTruthy();
});

test('orz', () => {
  const rules = '<orz> <= <orz>" "<orz> | "("<orz>")" | {<orz>} | orz';

  expect(check(rules, '(orz orz)')).toBeTruthy();
  expect(check(rules, '')).toBeTruthy();
  expect(check(rules, '(orz)')).toBeTruthy();
  expect(!check(rules, '!(orz)')).toBeTruthy();
  expect(check(rules, '((orz (orz) orz ((orz))))')).toBeTruthy();
});

test('fs22', () => {
  const rule = `
    <identifier> <= a | b | y | z | 7 | x | c | k | m | n

    <whitespace> <= {" "}
    <unary_expression> <= <unary_operator> <primary_expression>
    <postfix_expression> <= <primary_expression> | <postfix_expression> ++ | <postfix_expression> --
    <primary_expression> <= "(" <special_expression> ")" | <identifier>
    <unary_operator> <= * | !
    <assignment_expression> <= <expression> <whitespace> <assignment_operator> <whitespace> <special_expression>
    <assignment_operator> <= = | +=
    <special_expression> <= <primary_expression> | <special_expression> <whitespace> <binary_operator> <whitespace> <expression>
    <binary_operator> <= * | / | + | %
    <expression> <= <assignment_expression> | <postfix_expression> | <unary_expression>
  `.trim();

  expect(check(rule, '*(a + b)')).toBeTruthy();
  expect(check(rule, 'z = *(a + b)')).toBeFalsy();
  expect(check(rule, 'y += (z / 7)')).toBeTruthy();
  expect(check(rule, 'x = (a = b)')).toBeFalsy();
  expect(check(rule, '(b++) += ((a + c))')).toBeFalsy();
  expect(check(rule, 'a = (*b * *c)')).toBeFalsy();
  expect(check(rule, 'y++ * 7')).toBeFalsy();
  expect(check(rule, 'k = m = n')).toBeTruthy();

  expect(check(rule, '*(a+b)')).toBeTruthy();
  expect(check(rule, 'z=*(a+b)')).toBeFalsy();
  expect(check(rule, 'y+=(z/7)')).toBeTruthy();
  expect(check(rule, 'x=(a=b)')).toBeFalsy();
  expect(check(rule, '(b++)+=((a+c))')).toBeFalsy();
  expect(check(rule, 'a=(*b**c)')).toBeFalsy();
  expect(check(rule, 'y++*7')).toBeFalsy();
  expect(check(rule, 'k=m=n')).toBeTruthy();
});

test('nested-option', () => {
  const rule = `
    <rule> <= (A | B) C
  `.trim();

  expect(check(rule, 'AC')).toBeTruthy();
  expect(check(rule, 'BC')).toBeTruthy();
  expect(check(rule, 'C')).toBeFalsy();
  expect(check(rule, 'ABC')).toBeFalsy();
  expect(check(rule, 'BAC')).toBeFalsy();
});

test('carriage-return', () => {
  const rule = '<ziffer> <= 0|     1|2|3|4\r\n\r    <palindrom> <= <ziffer> ';

  expect(check(rule, '0')).toBeTruthy();
  expect(check(rule, '1')).toBeTruthy();
  expect(check(rule, '2')).toBeTruthy();
  expect(check(rule, '3')).toBeTruthy();
  expect(check(rule, '4')).toBeTruthy();
});

test('fs22-mixed', () => {
  const rule = `
    <identifier> <- a | b | y | z | 7 | x | c | k | m | n

    <whitespace> <= {" "}
    <unary_expression> <= <unary_operator> <primary_expression>
    <postfix_expression> <= <primary_expression> | <postfix_expression> ++ | <postfix_expression> --
    <primary_expression> <= "(" <special_expression> ")" | <identifier>
    <unary_operator> <- * | !
    <assignment_expression> <= <expression> <whitespace> <assignment_operator> <whitespace> <special_expression>
    <assignment_operator> <= = | +=
    <special_expression> <= <primary_expression> | <special_expression> <whitespace> <binary_operator> <whitespace> <expression>
    <binary_operator> <- * | / | + | %
    <expression> <= <assignment_expression> | <postfix_expression> | <unary_expression>
  `.trim();

  expect(check(rule, '*(a + b)')).toBeTruthy();
  expect(check(rule, 'z = *(a + b)')).toBeFalsy();
  expect(check(rule, 'y += (z / 7)')).toBeTruthy();
  expect(check(rule, 'x = (a = b)')).toBeFalsy();
  expect(check(rule, '(b++) += ((a + c))')).toBeFalsy();
  expect(check(rule, 'a = (*b * *c)')).toBeFalsy();
  expect(check(rule, 'y++ * 7')).toBeFalsy();
  expect(check(rule, 'k = m = n')).toBeTruthy();

  expect(check(rule, '*(a+b)')).toBeTruthy();
  expect(check(rule, 'z=*(a+b)')).toBeFalsy();
  expect(check(rule, 'y+=(z/7)')).toBeTruthy();
  expect(check(rule, 'x=(a=b)')).toBeFalsy();
  expect(check(rule, '(b++)+=((a+c))')).toBeFalsy();
  expect(check(rule, 'a=(*b**c)')).toBeFalsy();
  expect(check(rule, 'y++*7')).toBeFalsy();
  expect(check(rule, 'k=m=n')).toBeTruthy();
});

test('fs22-mixed', () => {
  const rule = `
    <identifier> <- a | b | y | z | 7 | x | c | k | m | n

    <whitespace> <- {" "}
    <unary_expression> <- <unary_operator> <primary_expression>
    <postfix_expression> <- <primary_expression> | <postfix_expression> ++ | <postfix_expression> --
    <primary_expression> <- "(" <special_expression> ")" | <identifier>
    <unary_operator> <- * | !
    <assignment_expression> <- <expression> <whitespace> <assignment_operator> <whitespace> <special_expression>
    <assignment_operator> <- = | +=
    <special_expression> <- <primary_expression> | <special_expression> <whitespace> <binary_operator> <whitespace> <expression>
    <binary_operator> <- * | / | + | %
    <expression> <- <assignment_expression> | <postfix_expression> | <unary_expression>
  `.trim();

  expect(check(rule, '*(a + b)')).toBeTruthy();
  expect(check(rule, 'z = *(a + b)')).toBeFalsy();
  expect(check(rule, 'y += (z / 7)')).toBeTruthy();
  expect(check(rule, 'x = (a = b)')).toBeFalsy();
  expect(check(rule, '(b++) += ((a + c))')).toBeFalsy();
  expect(check(rule, 'a = (*b * *c)')).toBeFalsy();
  expect(check(rule, 'y++ * 7')).toBeFalsy();
  expect(check(rule, 'k = m = n')).toBeTruthy();

  expect(check(rule, '*(a+b)')).toBeTruthy();
  expect(check(rule, 'z=*(a+b)')).toBeFalsy();
  expect(check(rule, 'y+=(z/7)')).toBeTruthy();
  expect(check(rule, 'x=(a=b)')).toBeFalsy();
  expect(check(rule, '(b++)+=((a+c))')).toBeFalsy();
  expect(check(rule, 'a=(*b**c)')).toBeFalsy();
  expect(check(rule, 'y++*7')).toBeFalsy();
  expect(check(rule, 'k=m=n')).toBeTruthy();
});

