import { SequenceErrorDetails } from "./SequenceTypes";

/**
 * SequenceError
 *
 * @template I
 */
export class SequenceError<I, O> extends Error {
  readonly details: SequenceErrorDetails<I, O>;

  constructor(details: SequenceErrorDetails<I, O>) {
    super(`Error in step: ${String(details.stepKey)}`);
    this.details = details;
    this.name = `SequenceError`;
  }
}
