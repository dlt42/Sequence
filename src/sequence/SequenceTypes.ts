import { SequenceLogger } from "./SequenceLogger";

export type StepEvaluationOptions = {
  whenNotNullSFA: `EvaluateAll` | `Return`;
  whenNotNull: `Reevaluate` | `Return` | `ThrowException`;
  onStepError: `ThrowException` | `Return`;
};

export type EvaluationOptions = StepEvaluationOptions & {
  loggingEnabled: boolean;
};

export type SequenceLoggerConstructorArgs = {
  enabled: boolean;
  sequenceName: string;
};

export type StepLoggerConstructorArgs<INPUT, OUTPUT> = {
  stepKey: keyof OUTPUT;
  logger: SequenceLogger<INPUT, OUTPUT>;
};

export type SequenceLogItem<INPUT, OUTPUT, T> = T extends
  | string
  | object
  | Error
  | OUTPUT
  | INPUT
  ? T
  : never;

export type HandlerFunction<INPUT, OUTPUT, KEY extends keyof OUTPUT> = ({
  input,
  output,
}: {
  input: Readonly<INPUT>;
  output: Partial<Readonly<OUTPUT>>;
}) => Promise<Required<OUTPUT>[KEY]>;

export type Step<INPUT, OUTPUT, KEY extends keyof OUTPUT> = {
  handlers: HandlerFunction<INPUT, OUTPUT, KEY>[];
  options?: StepEvaluationOptions;
  index: number;
};

export type SequenceDefinition<INPUT, OUTPUT> = {
  name: string;
  steps: {
    [K in keyof Required<OUTPUT>]: Step<INPUT, OUTPUT, K>;
  };
};

export type SequenceProcessorConstructorArgs<INPUT, OUTPUT> = {
  definition: SequenceDefinition<INPUT, OUTPUT>;
  options: EvaluationOptions | null;
};

export type SequenceErrorDetails<INPUT, OUTPUT> = {
  stepKey: string | number | symbol;
  state: INPUT;
  input: OUTPUT;
  error: string;
};
