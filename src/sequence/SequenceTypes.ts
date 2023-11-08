import { Result } from "true-myth";
import { SequenceError } from "./SequenceError";
import { SequenceLogger } from "./SequenceLogger";

type Key<S> = keyof S;

type KeysArray<S> = Key<S>[];

export type SequenceProcessorConstructorArgs<S, T extends KeysArray<S>> = {
  definition: SequenceDefinition<S, T>;
  options: EvaluationOptions | null;
};

export type SequenceLoggerConstructorArgs = {
  enabled: boolean;
  sequenceName: string;
};

export type StepLoggerConstructorArgs<S> = {
  stepKey: Key<S>;
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

export type HandlerFunction<S, PK extends Key<S>> = (
  data: Partial<Readonly<S>>
) => Promise<S[PK]>;

export type HandlerFunctions<S, PK extends Key<S>> = HandlerFunction<S, PK>[];

export type SequenceSteps<S, T extends KeysArray<S>> = {
  [PK in keyof Required<Pick<S, T[number]>>]: HandlerFunctions<S, PK>;
};

export type StepOptions<S, T extends KeysArray<S>> = {
  [PK in keyof Pick<S, T[number]>]: StepEvaluationOptions;
};

export type SequenceDefinition<S, T extends KeysArray<S>> = {
  name: string;
  order: T;
  steps: SequenceSteps<S, T>;
  stepOptions?: StepOptions<S, T>;
};

export type SequenceDefinitionNew<S, T extends KeysArray<S>> = {
  name: string;
  steps: {
    [PK in keyof Required<Pick<S, T[number]>>]: {
      funcs: HandlerFunctions<S, PK>;
      options?: StepEvaluationOptions;
      index: number;
    };
  };
};

export type SequenceProcessor<S> = {
  evaluate: (initialState: S) => Promise<Result<S, SequenceError<S>>>;
};

export type SequenceErrorDetails<I> = {
  stepKey: string | number | symbol;
  state: I;
  error: string;
};
