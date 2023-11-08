import { describe, expect, test } from "vitest";
import { sequence1 } from "./testSequence1";
import { sequence2 } from "./testSequence2";

describe(`sequence1`, () => {
  test(`works - evaluates valid input`, async () => {
    const result = await sequence1.evaluate(
      {},
      {
        a: `12`,
        b: `14`,
      }
    );
    expect(result.isErr).toBeFalsy();
    expect(result.isOk ? result.value : result.error).toEqual({
      convertA: 12,
      convertB: 14,
      squareA: 144,
      squareB: 196,
      evaluateC: 18.439088914585774,
    });
  });
  test(`works - errors for invalid input`, async () => {
    const result = await sequence1.evaluate(
      {},
      {
        a: `twelve`,
        b: `14`,
      }
    );
    expect(result.isErr).toBeTruthy();
    expect(result.isErr ? result.error.details : null).toEqual({
      input: {
        a: `twelve`,
        b: `14`,
      },
      stepKey: `convertA`,
      state: {},
      error: `input is not a number`,
    });
  });
  test(`works - errors for no input`, async () => {
    const result = await sequence1.evaluate(
      {},
      {
        a: ``,
        b: `14`,
      }
    );
    expect(result.isErr).toBeTruthy();
    console.log(JSON.stringify(result.isErr ? result.error : null));
    expect(result.isErr ? result.error.details : null).toEqual({
      stepKey: `convertA`,
      input: {
        a: ``,
        b: `14`,
      },
      state: {},
      error: `No value to convert`,
    });
  });
});

describe(`sequence2`, () => {
  test(`works - evaluates valid input`, async () => {
    const result = await sequence2.evaluate(
      {},
      {
        a: `3`,
      }
    );
    expect(result.isErr).toBeFalsy();
    expect(result.isOk ? result.value : result.error).toEqual({
      convertA: 6,
      processB: 106,
    });
  });
});
