import { SequenceProcessor } from "./SequenceProcessor";
import {
  HandlerFunction,
  HandlerFunctions,
  SequenceDefinition,
} from "./SequenceTypes";

export type SequenceDataInput2 = {
  a: string;
};

export type SequenceDataOutput2 = {
  convertA?: number;
  processB?: number;
};

const operations2 = {
  convert: (initial: string, current?: number) => {
    console.log({
      initial,
      current,
    });
    if (current !== undefined && current !== null) {
      return current * 2;
    }
    const parsed = Number.parseInt(initial ?? ``, 10);
    if (Number.isNaN(parsed)) {
      throw Error(`input is not a number`);
    }
    return parsed;
  },

  evaluate: (current?: number) => {
    if (current !== undefined && current !== null) {
      return current + 100;
    }

    throw Error(`no input to process`);
  },
};

const convertHandlerFunction: HandlerFunction<
  SequenceDataInput2,
  SequenceDataOutput2,
  `convertA`
> = async ({ input, output }) => {
  return Promise.resolve(operations2.convert(input.a, output.convertA));
};

const definition1: SequenceDefinition<
  SequenceDataInput2,
  SequenceDataOutput2,
  [`convertA`, `processB`]
> = {
  name: `Convert, add and calculate root`,
  order: [`convertA`, `processB`],
  steps: {
    convertA: [convertHandlerFunction, convertHandlerFunction],
    processB: [
      async ({ output }) =>
        Promise.resolve(operations2.evaluate(output.convertA)),
    ],
  },
  stepOptions: {
    convertA: {
      whenNotNullSFA: `EvaluateAll`,
      onStepError: `ThrowException`,
      whenNotNull: `Reevaluate`,
    },
  },
};

export const sequence2 = new SequenceProcessor({
  definition: definition1,
  options: {
    loggingEnabled: true,
    onStepError: `ThrowException`,
    whenNotNull: `Reevaluate`,
    whenNotNullSFA: `Return`,
  },
});
