import { SequenceProcessor } from "./SequenceProcessor";
import { KeysArray, SequenceDefinition } from "./SequenceTypes";

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

const keys: KeysArray<SequenceDataOutput1> = [
  `convertA`,
  `convertB`,
  `squareA`,
  `squareB`,
  `evaluateC`,
];

const definition1: SequenceDefinition<
  SequenceDataInput1,
  SequenceDataOutput1,
  typeof keys
> = {
  name: `Convert, add and calculate root`,
  order: keys,
  steps: {
    convertA: [
      async ({ input }) => Promise.resolve(operations1.convert(input.a)),
    ],
    convertB: [
      async ({ input }) => Promise.resolve(operations1.convert(input.b)),
    ],
    squareA: [
      async ({ output }) =>
        Promise.resolve(operations1.square(output.convertA)),
    ],
    squareB: [
      async ({ output }) =>
        Promise.resolve(operations1.square(output.convertB)),
    ],
    evaluateC: [
      async ({ output }) => {
        if (!output.squareA || !output.squareB) {
          throw Error(`Cannot calculate root for C`);
        }
        return Promise.resolve(Math.sqrt(output.squareA + output.squareB));
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
