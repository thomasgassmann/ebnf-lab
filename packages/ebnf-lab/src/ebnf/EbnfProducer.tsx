import { Button, Stack, Preformatted } from '../ui';
import { useCallback, useEffect, useState } from 'react';
import { Producer } from './producer';
import { parseChomsky } from './chomsky';

export type EbnfProducerProps = {
  rules: string;
  maxHeight?: string;
};

export const EbnfProducer = ({ rules, maxHeight }: EbnfProducerProps) => {
  const [producer, setProducer] = useState<Producer | null>(null);
  const [words, setWords] = useState<string[]>([]);

  const setWordsFromProducer = useCallback(
    (p: Producer) => {
      setWords(Array.from(p?.allWords().values() ?? []));
    },
    [setWords]
  );

  const initProducer = useCallback(() => {
    try {
      const chomsky = parseChomsky(rules);
      const p = Producer.fromChomsky(chomsky);
      setProducer(p);
      setWordsFromProducer(p);
    } catch {
      setProducer(null);
    }
  }, [setProducer, rules, setWordsFromProducer]);

  const produceWords = useCallback(() => {
    if (producer) {
      producer.findNext();
      setWordsFromProducer(producer);
    }
  }, [producer, setWordsFromProducer]);

  useEffect(() => {
    initProducer();
  }, [initProducer]);

  if (producer === null) {
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
            disabled={producer.isDone()}
            onClick={produceWords}
          >
            Produce words of length {producer.currentLength() + 1}
          </Button>
          <Button onClick={initProducer}>
            Reset
          </Button>
        </Stack>
        {words.length === 0 && (
          <p>
            There are no words of length {producer.currentLength()} or less in
            this grammar.
          </p>
        )}
        {producer.isDone() && (
          <p>
            It is impossible to generate more words than listed below in this
            grammar.
          </p>
        )}
        <Stack>
          {words.map((item) => (
            <div
              className="bg-[#272822] p-4 my-2 overflow-auto rounded-md text-white"
              key={item}
            >
              <Preformatted>
                {item === '' ? '(this grammar produces the empty word)' : item}
              </Preformatted>
            </div>
          ))}
        </Stack>
      </Stack>
    </div>
  );
};
