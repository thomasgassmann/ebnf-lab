import { useCallback, useEffect, useState } from 'react';
import { Button, Stack, Preformatted } from '../ui';
import { Producer } from './producer';
import { parseChomsky } from './chomsky';

export type CounterExample = {
  word: string;
  acceptedByLeft: boolean;
};

const getCounterExamples = (
  leftProducer: Producer,
  rightProducer: Producer
): CounterExample[] => {
  // find all words produced by left, but not by right
  const first: CounterExample[] = Array.from(leftProducer.allWords().values())
    .filter((x) => !rightProducer.allWords().has(x))
    .map((x) => ({ acceptedByLeft: true, word: x }));

  // find all words produced by right, but not by left
  const second: CounterExample[] = Array.from(rightProducer.allWords().values())
    .filter((x) => !leftProducer.allWords().has(x))
    .map((x) => ({ acceptedByLeft: false, word: x }));

  return first.concat(second).sort((a, b) => a.word.length - b.word.length);
};

export const EbnfComparison = ({
  maxHeight,
  rules,
  comparison
}: {
  maxHeight?: string;
  rules: string;
  comparison: string;
}) => {
  const [leftProducer, setLeftProducer] = useState<Producer | null>(null);
  const [rightProducer, setRightProducer] = useState<Producer | null>(null);
  const [counterExamples, setCounterExamples] = useState<CounterExample[]>([]);

  const init = useCallback(() => {
    try {
      const chomskyLeft = parseChomsky(rules);
      const chomskyRight = parseChomsky(comparison);
      const left = Producer.fromChomsky(chomskyLeft);
      const right = Producer.fromChomsky(chomskyRight);
      setLeftProducer(left);
      setRightProducer(right);

      setCounterExamples(getCounterExamples(left, right));
    } catch {
      setCounterExamples([]);
      setLeftProducer(null);
      setRightProducer(null);
    }
  }, [setLeftProducer, setRightProducer, rules, comparison]);

  useEffect(() => {
    init();
  }, [init]);

  const check = useCallback(() => {
    if (leftProducer && rightProducer) {
      leftProducer.findNext();
      rightProducer.findNext();

      setCounterExamples(getCounterExamples(leftProducer, rightProducer));
    }
  }, [leftProducer, rightProducer, setCounterExamples]);

  if (leftProducer === null || rightProducer === null) {
    return (
      <div>
        <p className="text-muted-foreground text-center">
          Please make sure you have some valid rules first.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxHeight, overflow: maxHeight && 'auto' }}>
      <Stack $gap>
        <Stack $horizontal $gap>
          <Button
            disabled={leftProducer.isDone() && rightProducer.isDone()}
            onClick={check}
          >
            Check length {leftProducer.currentLength() + 1}
          </Button>
          <Button onClick={init}>
            Reset
          </Button>
        </Stack>
      </Stack>
      {counterExamples.length === 0 && (
        <p className="py-2">
          The EBNF grammars are equivalent for all words up to length{' '}
          {leftProducer.currentLength()}
        </p>
      )}
      <Stack>
        {counterExamples.map((item) => (
          <div
            className="bg-[#272822] p-4 my-2 overflow-auto rounded-md text-white"
            key={item.word}
          >
            {item.acceptedByLeft && (
              <p className="text-muted-foreground">
                Produced by left, but not right
              </p>
            )}
            {!item.acceptedByLeft && (
              <p className="text-muted-foreground text-end">
                Produced by right, but not left
              </p>
            )}
            <Preformatted className={!item.acceptedByLeft ? 'text-end' : ''}>
              {item.word === ''
                ? '(this grammar produces the empty word)'
                : item.word}
            </Preformatted>
          </div>
        ))}
      </Stack>
    </div>
  );
};
