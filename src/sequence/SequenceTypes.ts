import { Result } from "true-myth";
import { SequenceError } from "./SequenceError";
import { SequenceLogger } from "./SequenceLogger";

export type SequenceProcessorConstructorArgs<S, T extends (keyof S)[]> = {
  definition: SequenceDefinition<S, T>;
  options: EvaluationOptions | null;
};

export type SequenceLoggerConstructorArgs = {
  enabled: boolean;
  sequenceName: string;
};

export type StepLoggerConstructorArgs<S> = {
  stepKey: keyof S;
  logger: SequenceLogger<S>;
};

export type StepEvaluationOptions = {
  whenNotNullSFA: `EvaluateAll` | `Return`;
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
  data: Readonly<S>
) => Promise<S[PK]>;

export type SequenceSteps<S, T extends (keyof S)[]> = {
  [PK in keyof Pick<S, T[number]>]: {
    handlerFunction: HandlerFunction<S, PK> | HandlerFunction<S, PK>[];
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

export type SequenceErrorDetails<I> = {
  stepName: string;
  state: I;
  error: string;
};
