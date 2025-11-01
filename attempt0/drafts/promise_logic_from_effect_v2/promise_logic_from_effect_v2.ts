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
export function promise_logic_from_effect_v2<
  N extends string,
  Ef extends Effect.Effect<any, any, any>,
  A extends any[],
  T extends (
    first_arg: {
      context: {
        Input: Record<
          N,
          & {
            actor: (...params: A) => Ef;
          }
          & (Effect.Effect.Context<Ef> extends Layer.Layer<any>
            ? { layer: Layer.Layer<Ef> }
            : { layer?: never })
        >;
      };
    },
    ...args: A
  ) => Ef,
>(name: N) {
  return fromPromise<
    Either.Either<
      Effect.Effect.Success<Ef>,
      Effect.Effect.Error<Ef>
    >,
    Parameters<T>
  >(
    async ({ input: [{ context }, ...args] }) => {
      const { actor, layer } = context.Input[name];
      const effect = actor(...args as A);

      const program = Effect.provide(
        effect,
        layer ?? Layer.empty,
      ) as Effect.Effect<
        Effect.Effect.Success<ReturnType<T>>,
        | Effect.Effect.Error<ReturnType<T>>
        | Layer.Layer.Error<
          Layer.Layer<Ef>
        >,
        never
      >;

      const result = await program.pipe(Effect.either, Effect.runPromise);
      console.log(result);
      return result;
    },
  );
}
