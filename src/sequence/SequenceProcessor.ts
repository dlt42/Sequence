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
 * @template S Any object type
 * @template T An array of keys of S
 */
export class SequenceProcessor<I, O, T extends (keyof O)[]> {
  readonly defintion: SequenceDefinition<I, O, T>;
  readonly options: EvaluationOptions;
  readonly logger;

  /**
   *
   * @param param0
   */
  constructor({
    definition,
    options,
  }: SequenceProcessorConstructorArgs<I, O, T>) {
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

  private getStepOptions = ({ stepKey }: { stepKey: keyof O }) => {
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
    handlerFunctions: HandlerFunction<I, O, keyof O>[];
    input: Readonly<I>;
    state: Readonly<O>;
    stepKey: keyof O;
    stepLogger: StepLogger<I, O>;
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
      Promise.resolve(state[stepKey]) as Promise<O[keyof O]>
    );
  };

  private evaluateState = async ({
    input,
    state,
    stepKey,
  }: {
    input: I;
    state: Readonly<O>;
    stepKey: keyof O;
  }) => {
    const stepLogger = new StepLogger({ stepKey, logger: this.logger });
    const handlerFunctions = this.defintion.steps[stepKey];

    /*
     * typeof step === `object` && !Array.isArray(step) && step !== null
     *   ? step.handlerFunction
     *  :
     */
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
    initialState: Readonly<O>,
    input: I
  ): Promise<Result<O, SequenceError<I, O>>> => {
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
        Promise.resolve(initialState) as Promise<O>
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
        error: error as SequenceError<I, O>,
      });
      return Result.err(error as SequenceError<I, O>);
    }
  };
}
