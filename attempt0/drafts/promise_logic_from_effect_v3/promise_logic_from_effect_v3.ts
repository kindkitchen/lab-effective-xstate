import { Effect, Either } from "effect";
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
export function promise_logic_from_effect_v3<
  Eff extends Effect.Effect<any, any, never>,
  Params extends any[],
  Name extends string,
  Ctx extends { Actor: Record<Name, (...params: Params) => Eff> },
  T extends (first_param: Ctx, ...params: Params) => Eff,
>(name: Name) {
  return fromPromise<
    Either.Either<
      Effect.Effect.Success<Eff>,
      Effect.Effect.Error<Eff>
    >,
    Parameters<T>
  >(
    async ({ input: [{ Actor }, ...args] }) => {
      const effect = Actor[name](...args as Params);

      const program = effect as Effect.Effect<
        Effect.Effect.Success<ReturnType<T>>,
        Effect.Effect.Error<ReturnType<T>>
      >;

      const result = await program.pipe(Effect.either, Effect.runPromise);

      return result;
    },
  );
}
