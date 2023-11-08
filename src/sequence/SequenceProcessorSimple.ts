/*
 * import { Result } from "true-myth";
 * import { SequenceError } from "./SequenceError";
 * import { SequenceDefinition } from "./SequenceTypesSimple";
 * export class SequenceProcessorSimple<I, O, T extends (keyof O)[]> {
 *   defintion;
 *   constructor(definition: SequenceDefinition<I, O, T>) {
 *     this.defintion = definition;
 *   }
 *   evaluate = async (
 *     initialState: O,
 *     input: I
 *   ): Promise<Result<O, SequenceError<I, O>>> => {
 *     const { steps, order } = this.defintion;
 *     try {
 *       const evaluatedState = await Array.from(new Set(order).values()).reduce(
 *         async (state, stepKey) => {
 *           const { stepName, handlerFunction } = steps[stepKey];
 *           try {
 *             return {
 *               ...state,
 *               [stepKey]: await handlerFunction(await state),
 *             };
 *           } catch (error) {
 *             throw new SequenceError({
 *               stepKey,
 *               state,
 *               error: error instanceof Error ? error.message : `Unknown error`,
 *             });
 *           }
 *         },
 *         Promise.resolve(initialState) as Promise<S>
 *       );
 *       return Result.ok(evaluatedState);
 *     } catch (error) {
 *       return Result.err(error as SequenceError<S>);
 *     }
 *   };
 * }
 */
