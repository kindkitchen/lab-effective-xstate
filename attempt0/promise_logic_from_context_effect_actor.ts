import { Effect, Either } from "effect";
import { fromPromise } from "xstate";

/**
 * ## Transform effect, declared in context into promise logic.
 *
 * @description
 * #### Opinionated!
 * This transformer make assumption about how context.Actor should be. Or more precisely - it reuse it.
 *
 * - The actor has shape as `() => Effect` and it should be located in `context.Actor["example"]`.
 * - So the main goal - is totally free machine from any implementations.
 * - Though they are still present in context.Actor - possibly it will be mapped here from `input`
 * - Both <Success> and <Error> channels from <Effect> is piped to <onDone> but wrapped into <Either>.
 * - So into <onError> will be passed <Panic>
 */
export function promise_logic_from_context_effect_actor<
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
