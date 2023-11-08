import { SequenceErrorDetails } from "./SequenceTypes";

/**
 * SequenceError
 *
 * @template I
 */
export class SequenceError<INPUT, OUTPUT> extends Error {
  readonly details: SequenceErrorDetails<INPUT, OUTPUT>;

  constructor(details: SequenceErrorDetails<INPUT, OUTPUT>) {
    super(`Error in step: ${String(details.stepKey)}`);
    this.details = details;
    this.name = `SequenceError`;
  }
}
