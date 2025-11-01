import { createActor, setup, toPromise } from "xstate";
import { Effect } from "effect";
import { promise_logic_from_effect_v2 } from "../promise_logic_from_effect_v2/promise_logic_from_effect_v2.ts";

const x = {
  INIT: {
    name: "Init",
    ref: "#Init",
  },
  PROCESS: {
    name: "Process",
    ref: "#Process",
  },
  DONE: {
    name: "Done",
    ref: "#Done",
  },
};

type Input = {
  demo: { actor: (num: number) => Effect.Effect<{ ok: boolean }> };
};

const machine = setup({
  types: {
    input: {} as Input,
    context: {} as {
      Input: Input;
    },
  },
  actors: {
    demo2: promise_logic_from_effect_v2("demo" as const),
  },
}).createMachine({
  initial: x.INIT.name,
  states: {
    [x.INIT.name]: {
      id: x.INIT.name,
      invoke: {
        src: "demo2",
        input: (x) => [x, 34] as const,
        onDone: {
          actions: ({ event }) => console.log(event.output._tag),
        },
        onError: {
          actions: ({ event }) => console.error("catched:", event.error),
        },
      },
      after: {
        500: x.DONE.ref,
      },
    },
    [x.DONE.name]: {
      id: x.DONE.name,
      type: "final",
    },
  },
  context: ({ input }) => {
    return {
      Input: input,
    };
  },
});

const origin = Effect.gen(function* () {
  if ((() => Math.random() > 0.4)()) {
    yield* Effect.fail("Ooops");
  } else if (Math.random() > 0.2) {
    throw new Error("PANIC");
  }

  return {
    ok: true,
  };
});

await toPromise(
  createActor(machine, {
    input: {
      demo: {
        actor: (num) =>
          origin.pipe(Effect.orElse(() => Effect.succeed({ ok: false }))),
      },
    },
  }).start(),
);
