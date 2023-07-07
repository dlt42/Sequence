import { logger } from "../logger";
import { SequenceError } from "./SequenceError";
import {
  SequenceLoggerConstructorArgs,
  SequenceLogItem,
  StepLoggerConstructorArgs,
} from './SequenceTypes';

/**
 * SequenceLogger
 *
 * @template S Any object type
 */
export class SequenceLogger<S> {
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
  logItems = <T extends SequenceLogItem<S, string | object | Error | S>>({
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
  log = ({ action, state }: { action: string; state: S }) => {
    this.logItems({ lines: [action, this.sequenceName, `State:`, state] });
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
    error: SequenceError<S>;
  }) => {
    this.logItems({ lines: [action, this.sequenceName, `Error:`, error] });
  };
}

/**
 * StepLogger
 *
 * @template S Any object type
 */
export class StepLogger<S> {
  stepKey: keyof S;
  logger: SequenceLogger<S>;

  /**
   *
   * @param param0
   */
  constructor({ logger, stepKey }: StepLoggerConstructorArgs<S>) {
    this.stepKey = stepKey;
    this.logger = logger;
  }

  /**
   *
   * @param action
   * @param state
   */
  log = ({ action, state }: { action: string; state: S }) => {
    this.logger.logItems({
      lines: [action, String(this.stepKey), `State:`, state],
    });
  };
}
