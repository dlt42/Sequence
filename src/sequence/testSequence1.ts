import { SequenceProcessor } from './SequenceProcessor';
import { SequenceDefinition } from './SequenceTypes';

export type SequenceDataInput1 = {
    a: string;
    b: string;
  };
  
  export type SequenceDataOutput1 = {
    convertA?: number;
    convertB?: number;
    squareA?: number;
    squareB?: number;
    evaluateC?: number;
  };
  
  const operations1 = {
    convert: (input?: string) => {
      if (!input || input.length === 0) {
        throw Error(`No value to convert`);
      }
      const parsed = Number.parseInt(input ?? ``, 10);
      if (Number.isNaN(parsed)) {
        throw Error(`input is not a number`);
      }
      return parsed;
    },
  
    square: (input?: number) => {
      if (!input) {
        throw Error(`No value to square`);
      }
      return input * input;
    },
  };
  
  const definition1: SequenceDefinition<
    SequenceDataInput1,
    SequenceDataOutput1,
    [`convertA`, `convertB`, `squareA`, `squareB`, `evaluateC`]
  > = {
    name: `Convert, add and calculate root`,
    order: [`convertA`, `convertB`, `squareA`, `squareB`, `evaluateC`],
    steps: {
      convertA: [async (input) => Promise.resolve(operations1.convert(input.a))],
      convertB: [async (input) => Promise.resolve(operations1.convert(input.b))],
      squareA: [
        async (input) => Promise.resolve(operations1.square(input.convertA)),
      ],
      squareB: [
        async (input) => Promise.resolve(operations1.square(input.convertB)),
      ],
      evaluateC: [
        async (input) => {
          if (!input.squareA || !input.squareB) {
            throw Error(`Cannot calculate root for C`);
          }
          return Promise.resolve(Math.sqrt(input.squareA + input.squareB));
        },
      ],
    },
  };
  
  export const sequence1 = new SequenceProcessor({
    definition: definition1,
    options: {
      loggingEnabled: true,
      onStepError: `ThrowException`,
      whenNotNull: `Reevaluate`,
      whenNotNullSFA: `Return`,
    },
  });