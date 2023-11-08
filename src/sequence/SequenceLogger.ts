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
 * @template S Any object type
 */
export class SequenceLogger<I, O> {
  readonly enabled: boolean;
  readonly sequenceName: string;

  /**
   *
   * @param param0
   */
  constructor({ enabled, sequenceName }: SequenceLoggerConstructorArgs) {
    this.enabled = enabled;
    this.sequenceName = sequenceName;
  }

  /**
   *
   * @param lines
   */
  logItems = <
    T extends SequenceLogItem<I, O, string | object | Error | I | O>
  >({
    lines,
  }: {
    lines: T[];
  }) => {
    if (this.enabled) {
      const result = lines.reduce(
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
   * @param param0
   */
  log = ({ action, state, input }: { action: string; state: O; input: I }) => {
    this.logItems({
      lines: [action, this.sequenceName, `State:`, state, `Input:`, input],
    });
  };

  /**
   *
   * @param param0
   */
  logError = ({
    action,
    error,
  }: {
    action: string;
    error: SequenceError<I, O>;
  }) => {
    this.logItems({ lines: [action, this.sequenceName, `Error:`, error] });
  };
}

/**
 * StepLogger
 *
 * @template S Any object type
 */
export class StepLogger<I, O> {
  stepKey: keyof O;
  logger: SequenceLogger<I, O>;

  /**
   *
   * @param param0
   */
  constructor({ logger, stepKey }: StepLoggerConstructorArgs<I, O>) {
    this.stepKey = stepKey;
    this.logger = logger;
  }

  /**
   *
   * @param action
   * @param state
   */
  log = ({ action, state, input }: { action: string; state: O; input: I }) => {
    this.logger.logItems({
      lines: [action, String(this.stepKey), `State:`, state, `Input:`, input],
    });
  };
}
