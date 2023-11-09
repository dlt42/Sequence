import { SequenceProcessor } from "./SequenceProcessor";
import { SequenceDefinition } from "./SequenceTypes";

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
const definition1: SequenceDefinition<SequenceDataInput1, SequenceDataOutput1> =
  {
    name: `Convert, add and calculate root`,
    steps: {
      convertA: {
        handlers: [
          async ({ input }) => Promise.resolve(operations1.convert(input.a)),
        ],
        index: 0,
      },
      convertB: {
        handlers: [
          async ({ input, output }) =>
            Promise.resolve(operations1.convert(input.b)),
        ],
        index: 1,
      },
      squareA: {
        handlers: [
          async ({ output }) =>
            Promise.resolve(operations1.square(output.convertA)),
        ],
        index: 2,
      },
      squareB: {
        handlers: [
          async ({ output }) =>
            Promise.resolve(operations1.square(output.convertB)),
        ],
        index: 3,
      },
      evaluateC: {
        handlers: [
          async ({ output }) => {
            if (!output.squareA || !output.squareB) {
              throw Error(`Cannot calculate root for C`);
            }
            return Promise.resolve(Math.sqrt(output.squareA + output.squareB));
          },
        ],
        index: 4,
      },
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
