import { Effect, Either } from "effect";
import { fromPromise } from "xstate";

/**
 * ## Transform effect, declared in context into promise logic.
 *
 * @description
 * This is a sacrifice of interface independency for sugar usage!
 * The transformer make assumption about where fn => effect should be placed.
 * It should be placed in { Actor: Record<name, here!> }.
 * The reason for such design is practical usage, when such object may simply be a context of the machine.
 *
 * - The Actor[key] has shape as `() => Effect` and it should be located in `context.Actor["example"]`.
 * - So the main goal - is totally free machine from any implementations.
 * - Though they are still present in context.Actor - possibly it will be mapped here from `input`
 * - Both <Success> and <Error> channels from <Effect> is piped to <onDone> but wrapped into <Either>.
 * - So into <onError> will be passed <Panic>
 */
export const logic_from_box_with_eff_fns = <
    Ctx extends {
        Actor: Record<
            string,
            (...params: any[]) => Effect.Effect<any, any, never>
        >;
    },
>(name: keyof Ctx["Actor"]) => {
    type Name = typeof name;
    type Eff = ReturnType<Ctx["Actor"][Name]>;
    return fromPromise<
        Either.Either<
            Effect.Effect.Success<Eff>,
            Effect.Effect.Error<Eff>
        >,
        [Ctx, ...Parameters<Ctx["Actor"][Name]>]
    >(
        async ({ input: [{ Actor }, ...args] }) => {
            const effect = Actor[name as string](...args);

            const program = effect;

            const result = await program.pipe(Effect.either, Effect.runPromise);

            return result;
        },
    );
};
