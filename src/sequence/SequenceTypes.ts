import { Result } from "true-myth";
import { SequenceError } from "./SequenceError";
import { SequenceLogger } from "./SequenceLogger";

type Key<TYPE> = keyof TYPE;

export type KeysArray<TYPE> = Key<TYPE>[];

export type SequenceProcessorConstructorArgs<
  INPUT,
  OUTPUT,
  KEYS extends KeysArray<OUTPUT>
> = {
  definition: SequenceDefinition<INPUT, OUTPUT, KEYS>;
  options: EvaluationOptions | null;
};

export type SequenceLoggerConstructorArgs = {
  enabled: boolean;
  sequenceName: string;
};

export type StepLoggerConstructorArgs<INPUT, OUTPUT> = {
  stepKey: Key<OUTPUT>;
  logger: SequenceLogger<INPUT, OUTPUT>;
};

export type StepEvaluationOptions = {
  whenNotNullSFA: `EvaluateAll` | `Return`;
  whenNotNull: `Reevaluate` | `Return` | `ThrowException`;
  onStepError: `ThrowException` | `Return`;
};

export type EvaluationOptions = StepEvaluationOptions & {
  loggingEnabled: boolean;
};

export type SequenceLogItem<INPUT, OUTPUT, T> = T extends
  | string
  | object
  | Error
  | OUTPUT
  | INPUT
  ? T
  : never;

export type HandlerFunction<INPUT, OUTPUT, KEY extends Key<OUTPUT>> = ({
  input,
  output,
}: {
  input: Readonly<INPUT>;
  output: Partial<Readonly<OUTPUT>>;
}) => Promise<OUTPUT[KEY]>;

export type HandlerFunctions<
  INPUT,
  OUTPUT,
  KEY extends Key<OUTPUT>
> = HandlerFunction<INPUT, OUTPUT, KEY>[];

export type SequenceSteps<INPUT, OUTPUT, KEYS extends KeysArray<OUTPUT>> = {
  [KEY in keyof Required<Pick<OUTPUT, KEYS[number]>>]: HandlerFunctions<
    INPUT,
    OUTPUT,
    KEY
  >;
};

export type StepOptions<OUTPUT, KEYS extends KeysArray<OUTPUT>> = {
  [KEY in keyof Pick<OUTPUT, KEYS[number]>]: StepEvaluationOptions;
};

export type SequenceDefinition<
  INPUT,
  OUTPUT,
  KEYS extends KeysArray<OUTPUT>
> = {
  name: string;
  order: KEYS;
  steps: SequenceSteps<INPUT, OUTPUT, KEYS>;
  stepOptions?: StepOptions<OUTPUT, KEYS>;
};

export type SequenceDefinitionNew<
  INPUT,
  OUTPUT,
  KEYS extends KeysArray<OUTPUT>
> = {
  name: string;
  steps: {
    [KEY in keyof Required<Pick<OUTPUT, KEYS[number]>>]: {
      funcs: HandlerFunctions<INPUT, OUTPUT, KEY>;
      options?: StepEvaluationOptions;
      index: number;
    };
  };
};

export type SequenceProcessor<INPUT, OUTPUT> = {
  evaluate: (
    initialState: INPUT,
    input: OUTPUT
  ) => Promise<Result<OUTPUT, SequenceError<INPUT, OUTPUT>>>;
};

export type SequenceErrorDetails<INPUT, OUTPUT> = {
  stepKey: string | number | symbol;
  state: INPUT;
  input: OUTPUT;
  error: string;
};
