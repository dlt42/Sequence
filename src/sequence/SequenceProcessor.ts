import { Result } from "true-myth";
import { SequenceError } from "./SequenceError";
import {
  HandlerFunction,
  SequenceProcessorConstructorArgs,
  EvaluationOptions,
  SequenceDefinition,
} from "./SequenceTypes";
import { SequenceLogger, StepLogger } from "./SequenceLogger";

/**
 * SequenceProcessor
 *
 * @template INPUT Any object type
 * @template OUTPUT Any object type
 * @template KEYS An array of keys of S
 */
export class SequenceProcessor<INPUT, OUTPUT, KEYS extends (keyof OUTPUT)[]> {
  readonly defintion: SequenceDefinition<INPUT, OUTPUT, KEYS>;
  readonly options: EvaluationOptions;
  readonly logger;

  /**
   *
   * @param sequenceProcessorArgs SequenceProcessorConstructorArgs
   */
  constructor({
    definition,
    options,
  }: SequenceProcessorConstructorArgs<INPUT, OUTPUT, KEYS>) {
    this.defintion = definition;
    this.options = options ?? {
      loggingEnabled: true,
      onStepError: `ThrowException`,
      whenNotNull: `Reevaluate`,
      whenNotNullSFA: `Return`,
    };
    this.logger = new SequenceLogger({
      enabled: options ? options.loggingEnabled : true,
      sequenceName: this.defintion.name,
    });
  }

  private getStepOptions = ({ stepKey }: { stepKey: keyof OUTPUT }) => {
    const stepOptions = this.defintion.stepOptions
      ? this.defintion.stepOptions[stepKey]
      : null;
    return stepOptions || this.options;
  };

  private callHandlerFunction = async ({
    handlerFunctions,
    input,
    state,
    stepKey,
    stepLogger,
  }: {
    handlerFunctions: HandlerFunction<INPUT, OUTPUT, keyof OUTPUT>[];
    input: Readonly<INPUT>;
    state: Readonly<OUTPUT>;
    stepKey: keyof OUTPUT;
    stepLogger: StepLogger<INPUT, OUTPUT>;
  }) => {
    const { whenNotNullSFA } = this.getStepOptions({ stepKey });
    stepLogger.log({
      action: `Evaluating functions for step:`,
      state,
      input,
    });

    return handlerFunctions.reduce(
      async (value, currentHandlerFunction, index) => {
        const logDetail = `step function ${index + 1}`;
        const awaitedValue = await value;
        const evaluationState = {
          ...state,
          [stepKey]: awaitedValue,
        };

        stepLogger.log({
          action: `Evaluating ${logDetail}} for step:`,
          state: evaluationState,
          input,
        });

        if (!!awaitedValue) {
          switch (whenNotNullSFA) {
            case `Return`:
              stepLogger.log({
                action: `Evaluation of ${logDetail}} skipped for step:`,
                state,
                input,
              });
              return awaitedValue;

            case `EvaluateAll`:
            default:
              stepLogger.log({
                action: `Evaluation of ${logDetail} proceeding for step:`,
                state,
                input,
              });
              break;
          }
        }

        const result = await currentHandlerFunction({
          ...input,
          ...evaluationState,
          [stepKey]: awaitedValue,
        });

        stepLogger.log({
          action: `Evaluated ${logDetail}} for step:`,
          state: {
            ...state,
            [stepKey]: result,
          },
          input,
        });

        return result;
      },
      Promise.resolve(state[stepKey]) as Promise<OUTPUT[keyof OUTPUT]>
    );
  };

  private evaluateState = async ({
    input,
    state,
    stepKey,
  }: {
    input: INPUT;
    state: Readonly<OUTPUT>;
    stepKey: keyof OUTPUT;
  }) => {
    const stepLogger = new StepLogger({ stepKey, logger: this.logger });
    const handlerFunctions = this.defintion.steps[stepKey];
    const { whenNotNull, onStepError } = this.getStepOptions({ stepKey });
    try {
      stepLogger.log({ action: `Evaluating step:`, state, input });

      if (!!state[stepKey]) {
        switch (whenNotNull) {
          case `Return`:
            stepLogger.log({
              action: `Evaluation of Step skipped:`,
              state,
              input,
            });
            return state;

          case `ThrowException`:
            stepLogger.log({
              action: `Evaluation of Step blocked:`,
              state,
              input,
            });
            throw Error(`Value is not null`);

          case `Reevaluate`:
          default:
            stepLogger.log({
              action: `Evaluation of Step proceeding:`,
              state,
              input,
            });
            break;
        }
      }

      const newState = {
        ...state,
        [stepKey]: await this.callHandlerFunction({
          input,
          handlerFunctions,
          state,
          stepKey,
          stepLogger,
        }),
      };

      stepLogger.log({
        action: `Evaluation of Step complete:`,
        state: newState,
        input,
      });

      return newState;
    } catch (error) {
      switch (onStepError) {
        case `Return`:
          stepLogger.log({
            action: `Evaluation of Step aborted:`,
            state,
            input,
          });
          return state;

        case `ThrowException`:
        default:
          stepLogger.log({
            action: `Evaluation of Step failed:`,
            state,
            input,
          });
          throw new SequenceError({
            input,
            stepKey,
            state,
            error: error instanceof Error ? error.message : `Unknown error`,
          });
      }
    }
  };

  /**
   *
   * @param initialState
   * @returns
   */
  evaluate = async (
    initialState: Readonly<OUTPUT>,
    input: INPUT
  ): Promise<Result<OUTPUT, SequenceError<INPUT, OUTPUT>>> => {
    const { name: sequenceName, steps, order } = this.defintion;
    try {
      this.logger.log({
        action: `Evaluating Sequence:`,
        state: initialState,
        input,
      });

      const evaluatedState = await Array.from(new Set(order).values()).reduce(
        async (resultState, stepKey) => {
          return this.evaluateState({
            state: await resultState,
            stepKey,
            input,
          });
        },
        Promise.resolve(initialState) as Promise<OUTPUT>
      );

      this.logger.log({
        action: `Evaluation of Sequence complete:`,
        state: evaluatedState,
        input,
      });
      return Result.ok(evaluatedState);
    } catch (error) {
      this.logger.logError({
        action: `Evaluation error:`,
        error: error as SequenceError<INPUT, OUTPUT>,
      });
      return Result.err(error as SequenceError<INPUT, OUTPUT>);
    }
  };
}
