import { describe, expect, test } from "vitest";
import { SequenceProcessor } from "./SequenceProcessor";
import { SequenceError } from "./SequenceError";
import { SequenceDefinition } from "./SequenceTypes";

export type SequenceData = {
  a: string;
  b: string;
  convertA?: number;
  convertB?: number;
  squareA?: number;
  squareB?: number;
  evaluateC?: number;
};

const convert = (input?: string) => {
  if (!input || input.length === 0) {
    throw Error(`No value to convert`);
  }
  const parsed = Number.parseInt(input ?? ``, 10);
  if (Number.isNaN(parsed)) {
    throw Error(`input is not a number`);
  }
  return parsed;
};

const square = (input?: number) => {
  if (!input) {
    throw Error(`No value to square`);
  }
  return input * input;
};

const definition: SequenceDefinition<
  SequenceData,
  [`convertA`, `convertB`, `squareA`, `squareB`, `evaluateC`]
> = {
  name: `Convert, add and calculate root`,
  order: [`convertA`, `convertB`, `squareA`, `squareB`, `evaluateC`],
  steps: {
    convertA: [async (input) => Promise.resolve(convert(input.a))],
    convertB: [async (input) => Promise.resolve(convert(input.b))],
    squareA: [async (input) => Promise.resolve(square(input.convertA))],
    squareB: [async (input) => Promise.resolve(square(input.convertB))],
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
const sequence = new SequenceProcessor({
  definition,
  options: {
    loggingEnabled: true,
    onStepError: `ThrowException`,
    whenNotNull: `Reevaluate`,
    whenNotNullSFA: `Return`,
  },
});

describe(`sequence`, () => {
  test(`works - evaluates valid input`, async () => {
    const result = await sequence.evaluate({
      a: `12`,
      b: `14`,
    });
    // expect(result.isErr).toBeFalsy();
    expect(result.isOk ? result.value : result.error).toEqual({
      a: `12`,
      b: `14`,
      convertA: 12,
      convertB: 14,
      squareA: 144,
      squareB: 196,
      evaluateC: 18.439088914585774,
    });
  });
  test(`works - errors for invalid input`, async () => {
    const result = await sequence.evaluate({
      a: `twelve`,
      b: `14`,
    });
    expect(result.isErr).toBeTruthy();
    expect(result.isErr ? result.error : null).toEqual(
      new SequenceError({
        stepKey: `convertA`,
        state: {
          a: `twelve`,
          b: `14`,
        },
        error: `No value to convert`,
      })
    );
  });
  test(`works - errors for no input`, async () => {
    const result = await sequence.evaluate({
      a: ``,
      b: `14`,
    });
    expect(result.isErr).toBeTruthy();
    expect(result.isErr ? result.error : null).toEqual(
      new SequenceError({
        stepKey: `convertA`,
        state: {
          a: null,
          b: `14`,
          convertA: null,
          convertB: null,
          squareA: null,
          squareB: null,
          evaluateC: null,
        },
        error: `No value to convert`,
      })
    );
  });
});
