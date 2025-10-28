import { Effect, Either, Layer } from "effect";
import { fromPromise } from "xstate";

/**
 * #### Transform effect into promise logic.
 *
 * @description
 * - Both <Success> and <Error> channels from <Effect> is piped to <onDone> but wrapped into <Either>.
 * - So into <onError> will be passed <Panic>
 * - As parameters expected <Input> and explicit layer with all <Requirement>s
 * ---
 * read more:
 * - [Full documentation in markdown file](./promise_logic_from_effect.md)
 * - [Explore simple test fro this utility](./promise_logic_from_effect.test.ts)
 */
export function promise_logic_from_effect<
  T extends (...arg: any[]) => Effect.Effect<any, any, any>,
>(fn: T) {
  return fromPromise<
    Either.Either<
      Effect.Effect.Success<ReturnType<T>>,
      Effect.Effect.Error<ReturnType<T>>
    >,
    Effect.Effect.Context<ReturnType<T>> extends never
      ? { args: Parameters<T>; layer: Layer.Layer<never> }
      : {
        args: Parameters<T>;
        layer: Layer.Layer<Effect.Effect.Context<ReturnType<T>>>;
      }
  >(
    async ({ input }) => {
      const { args, layer } = input;
      const effect = fn(...args);

      const program = Effect.provide(effect, layer) as Effect.Effect<
        Effect.Effect.Success<ReturnType<T>>,
        | Effect.Effect.Error<ReturnType<T>>
        | Layer.Layer.Error<typeof layer>,
        never
      >;

      const result = await program.pipe(Effect.either, Effect.runPromise);

      return result;
    },
  );
}

promise_logic_from_effect;
