# About `promise_from_effect` function

```ts
import { createActor, setup, toPromise } from "xstate";
import { Effect, Either, Layer } from "effect";
import { promise_logic_from_effect } from "./promise_logic_from_effect.ts";

const machine = setup({
  actors: {
    example: promise_logic_from_effect((x: number) =>
      Effect.gen(function* () {
        if (x < 0.1) {
          throw new Error("Boom!");
        } else if (x < 0.5) {
          yield* Effect.fail("Oops...");
        }

        return "Ok";
      })
    ),
  },
})
  .createMachine({
    invoke: {
      src: "example",
      input: {
        args: [Math.random()],
        layer: Layer.empty,
      },
      onDone: {
        actions: ({ event }: any /// this will not be any in real typescript file (but here to be able run this md example with `deno test --doc`)
        ) => {
          if (Either.isRight(event.output)) {
            console.info("Success:", event.output.right);
          } else {
            console.warn("Fail:", event.output.left);
          }
        },
      },
      onError: {
        actions: ({ event }: any /// this will not be any in real typescript file (but here to be able run this md example with `deno test --doc`)
        ) => {
          console.error("Panic:", event.error);
        },
      },
    },
  });

await toPromise(createActor(machine).start());
```
