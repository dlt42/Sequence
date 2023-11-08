import { Result } from "true-myth";
import { SequenceError } from "./SequenceError";
import { SequenceLogger } from "./SequenceLogger";

type Key<S> = keyof S;

type KeysArray<S> = Key<S>[];

export type SequenceProcessorConstructorArgs<I, O, T extends KeysArray<O>> = {
  definition: SequenceDefinition<I, O, T>;
  options: EvaluationOptions | null;
};

export type SequenceLoggerConstructorArgs = {
  enabled: boolean;
  sequenceName: string;
};

export type StepLoggerConstructorArgs<I, O> = {
  stepKey: Key<O>;
  logger: SequenceLogger<I, O>;
};

export type StepEvaluationOptions = {
  whenNotNullSFA: `EvaluateAll` | `Return`;
  whenNotNull: `Reevaluate` | `Return` | `ThrowException`;
  onStepError: `ThrowException` | `Return`;
};

export type EvaluationOptions = StepEvaluationOptions & {
  loggingEnabled: boolean;
};

export type SequenceLogItem<I, O, T> = T extends string | object | Error | O | I
  ? T
  : never;

export type HandlerFunction<I, O, PK extends Key<O>> = (
  data: Partial<Readonly<O>> & Readonly<I>
) => Promise<O[PK]>;

export type HandlerFunctions<I, O, PK extends Key<O>> = HandlerFunction<
  I,
  O,
  PK
>[];

export type SequenceSteps<I, O, T extends KeysArray<O>> = {
  [PK in keyof Required<Pick<O, T[number]>>]: HandlerFunctions<I, O, PK>;
};

export type StepOptions<O, T extends KeysArray<O>> = {
  [PK in keyof Pick<O, T[number]>]: StepEvaluationOptions;
};

export type SequenceDefinition<I, O, T extends KeysArray<O>> = {
  name: string;
  order: T;
  steps: SequenceSteps<I, O, T>;
  stepOptions?: StepOptions<O, T>;
};

export type SequenceDefinitionNew<I, O, T extends KeysArray<O>> = {
  name: string;
  steps: {
    [PK in keyof Required<Pick<O, T[number]>>]: {
      funcs: HandlerFunctions<I, O, PK>;
      options?: StepEvaluationOptions;
      index: number;
    };
  };
};

export type SequenceProcessor<I, O> = {
  evaluate: (
    initialState: I,
    input: O
  ) => Promise<Result<O, SequenceError<I, O>>>;
};

export type SequenceErrorDetails<I, O> = {
  stepKey: string | number | symbol;
  state: I;
  input: O;
  error: string;
};
