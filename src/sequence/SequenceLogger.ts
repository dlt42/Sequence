import { logger } from "../logger";
import { SequenceError } from "./SequenceError";
import {
  SequenceLoggerConstructorArgs,
  SequenceLogItem,
  StepLoggerConstructorArgs,
} from "./SequenceTypes";

/**
 * SequenceLogger
 *
 * @template INPUT Any object type
 * @template OUTPUT Any object type
 */
export class SequenceLogger<INPUT, OUTPUT> {
  readonly enabled: boolean;
  readonly sequenceName: string;

  /**
   *
   * @param sequenceLoggerConstructorArgs
   */
  constructor({ enabled, sequenceName }: SequenceLoggerConstructorArgs) {
    this.enabled = enabled;
    this.sequenceName = sequenceName;
  }

  /**
   *
   * @param items
   */
  logItems = <
    LOGITEM extends SequenceLogItem<
      INPUT,
      OUTPUT,
      string | object | Error | INPUT | OUTPUT
    >
  >({
    items,
  }: {
    items: LOGITEM[];
  }) => {
    if (this.enabled) {
      const result = items.reduce(
        (output: string[], current) => {
          if (typeof current === `string`) {
            return [...output, current];
          }
          if (typeof current === `object`) {
            return [...output, JSON.stringify(current)];
          }
          return current instanceof Error
            ? [...output, current.message]
            : [...output, `Unknown error`];
        },
        [`\n`]
      );
      logger.debug(result.join(`\n`));
    }
  };

  /**
   *
   * @param logDetails
   */
  log = ({
    action,
    state,
    input,
  }: {
    action: string;
    state: OUTPUT;
    input: INPUT;
  }) => {
    this.logItems({
      items: [action, this.sequenceName, `State:`, state, `Input:`, input],
    });
  };

  /**
   *
   * @param logErrorDetails
   */
  logError = ({
    action,
    error,
  }: {
    action: string;
    error: SequenceError<INPUT, OUTPUT>;
  }) => {
    this.logItems({ items: [action, this.sequenceName, `Error:`, error] });
  };
}

/**
 * StepLogger
 *
 * @template INPUT Any object type
 * @template INPUT Any object type
 */
export class StepLogger<INPUT, OUTPUT> {
  stepKey: keyof OUTPUT;
  logger: SequenceLogger<INPUT, OUTPUT>;

  /**
   *
   * @param param0
   */
  constructor({ logger, stepKey }: StepLoggerConstructorArgs<INPUT, OUTPUT>) {
    this.stepKey = stepKey;
    this.logger = logger;
  }

  /**
   *
   * @param action
   * @param state
   */
  log = ({
    action,
    state,
    input,
  }: {
    action: string;
    state: OUTPUT;
    input: INPUT;
  }) => {
    this.logger.logItems({
      items: [action, String(this.stepKey), `State:`, state, `Input:`, input],
    });
  };
}
