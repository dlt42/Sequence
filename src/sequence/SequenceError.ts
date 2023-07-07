import { SequenceErrorDetails } from "./SequenceTypes";

/**
 * SequenceError
 * 
 * @template I 
 */
export class SequenceError<I> extends Error {
  readonly details: SequenceErrorDetails<I>;

  constructor(details: SequenceErrorDetails<I>) {
    super(`Error in step: ${details.stepName}`);
    this.details = details;
    this.name = `SequenceError`;
  }
}