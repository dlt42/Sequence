import { Result } from "true-myth";
import { SequenceError } from "./SequenceError";

export type StepEvaluationOptions = {
  whenNotNull: `Reevaluate` | `Return` | `ThrowException`;
  onStepError: `ThrowException` | `Return`;
};

export type EvaluationOptions = StepEvaluationOptions & {
  loggingEnabled: boolean;
};

export type SequenceLogItem<S, T> = T extends string | object | Error | S
  ? T
  : never;

export type HandlerFunction<S, PK extends keyof S> = (
  data: S
) => Promise<S[PK]>;

export type SequenceSteps<S, T extends (keyof S)[]> = {
  [PK in keyof Pick<S, T[number]>]: {
    handlerFunction: HandlerFunction<S, PK>;
    stepName: string;
    stepOptions?: StepEvaluationOptions;
  };
};

export type SequenceDefinition<S, T extends (keyof S)[]> = {
  name: string;
  order: T;
  steps: SequenceSteps<S, T>;
};

export type SequenceProcessor<S, T extends (keyof S)[]> = {
  evaluate: (initialState: S) => Promise<Result<S, SequenceError<S>>>;
};
