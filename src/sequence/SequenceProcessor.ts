import { Result } from "true-myth";
import { SequenceError } from "./SequenceError";
import {
  HandlerFunction,
  SequenceProcessorConstructorArgs,
} from "./SequenceTypes";
import { SequenceLogger, StepLogger } from "./SequenceLogger";

/**
 * SequenceProcessor
 *
 * @template S Any object type
 * @template T An array of keys of S
 */
export class SequenceProcessor<S, T extends (keyof S)[]> {
  readonly defintion;
  readonly options;
  readonly logger;

  /**
   *
   * @param param0
   */
  constructor({ definition, options }: SequenceProcessorConstructorArgs<S, T>) {
    this.defintion = definition;
    this.options = options ?? {
      loggingEnabled: true,
      onStepError: `Throw`,
      whenNotNull: `Reevaluate`,
      whenNotNullSFA: `Return`,
    };
    this.logger = new SequenceLogger({
      enabled: options ? options.loggingEnabled : true,
      sequenceName: this.defintion.name,
    });
  }

  private getStepOptions = ({ stepKey }: { stepKey: keyof S }) => {
    const { stepOptions } = this.defintion.steps[stepKey];
    return stepOptions || this.options;
  };

  private callHandlerFunction = async ({
    handlerFunction,
    state,
    stepKey,
    stepLogger,
  }: {
    handlerFunction:
      | HandlerFunction<S, keyof S>
      | HandlerFunction<S, keyof S>[];
    state: Readonly<S>;
    stepKey: keyof S;
    stepLogger: StepLogger<S>;
  }) => {
    const { whenNotNullSFA } = this.getStepOptions({ stepKey });
    if (Array.isArray(handlerFunction)) {
      stepLogger.log({
        action: `Evaluating multiple functions for step:`,
        state,
      });

      return handlerFunction.reduce(
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
          });

          if (awaitedValue !== null) {
            switch (whenNotNullSFA) {
              case `Return`:
                stepLogger.log({
                  action: `Evaluation of ${logDetail}} skipped for step:`,
                  state,
                });
                return awaitedValue;

              case `EvaluateAll`:
              default:
                stepLogger.log({
                  action: `Evaluation of ${logDetail} proceeding for step:`,
                  state,
                });
                break;
            }
          }

          const result = await currentHandlerFunction({
            ...evaluationState,
            [stepKey]: awaitedValue,
          });

          stepLogger.log({
            action: `Evaluated ${logDetail}} for step:`,
            state: {
              ...state,
              [stepKey]: result,
            },
          });

          return result;
        },
        Promise.resolve(state[stepKey]) as Promise<S[keyof S]>
      );
    } else {
      stepLogger.log({ action: `Evaluating single function for step:`, state });
      return handlerFunction(state);
    }
  };

  private evaluateState = async ({
    state,
    stepKey,
  }: {
    state: Readonly<S>;
    stepKey: keyof S;
  }) => {
    const stepLogger = new StepLogger({ stepKey, logger: this.logger });
    const { stepName, handlerFunction } = this.defintion.steps[stepKey];
    const { whenNotNull, onStepError } = this.getStepOptions({ stepKey });
    try {
      stepLogger.log({ action: `Evaluating step:`, state });

      if (!!state[stepKey]) {
        switch (whenNotNull) {
          case `Return`:
            stepLogger.log({ action: `Evaluation of Step skipped:`, state });
            return state;

          case `ThrowException`:
            stepLogger.log({ action: `Evaluation of Step blocked:`, state });
            throw Error(`Value is not null`);

          case `Reevaluate`:
          default:
            stepLogger.log({ action: `Evaluation of Step proceeding:`, state });
            break;
        }
      }

      const newState = {
        ...state,
        [stepKey]: await this.callHandlerFunction({
          handlerFunction,
          state,
          stepKey,
          stepLogger,
        }),
      };

      stepLogger.log({
        action: `Evaluation of Step complete:`,
        state: newState,
      });

      return newState;
    } catch (error) {
      switch (onStepError) {
        case `Return`:
          stepLogger.log({ action: `Evaluation of Step aborted:`, state });
          return state;

        case `Throw`:
        default:
          stepLogger.log({ action: `Evaluation of Step failed:`, state });
          throw new SequenceError({
            stepName,
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
    initialState: Readonly<S>
  ): Promise<Result<S, SequenceError<S>>> => {
    const { name: sequenceName, steps, order } = this.defintion;
    try {
      this.logger.log({ action: `Evaluating Sequence:`, state: initialState });

      const evaluatedState = await Array.from(new Set(order).values()).reduce(
        async (resultState, stepKey) => {
          return this.evaluateState({ state: await resultState, stepKey });
        },
        Promise.resolve(initialState) as Promise<S>
      );

      this.logger.log({
        action: `Evaluation of Sequence complete:`,
        state: evaluatedState,
      });
      return Result.ok(evaluatedState);
    } catch (error) {
      this.logger.logError({
        action: `Evaluation error:`,
        error: error as SequenceError<S>,
      });
      return Result.err(error as SequenceError<S>);
    }
  };
}
