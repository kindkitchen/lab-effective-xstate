import { Effect } from "effect";
import { createActor, setup, toPromise } from "xstate";
import { promise_logic_from_effect_v3 } from "./promise_logic_from_effect_v3.ts";

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

type Input = {};

const machine = setup({
  types: {
    input: {} as Input,
    context: {} as {
      Input: Input;
      Actor: {
        demo: (num: number) => Effect.Effect<{ ok: boolean }, "Oops">;
      };
    },
  },
  actors: {
    demo2: promise_logic_from_effect_v3("demo" as const),
  },
}).createMachine({
  initial: x.INIT.name,
  states: {
    [x.INIT.name]: {
      id: x.INIT.name,
      invoke: {
        src: "demo2",
        input: ({ context }) => [context, 34] as const,
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
      Actor: {
        demo: (num) => origin,
      },
    };
  },
});

const origin = Effect.gen(function* () {
  if (Math.random() > 0.5) {
    yield* Effect.fail("Oops" as const);
  } else if (Math.random() > 0.6) {
    throw new Error("PANIC");
  }

  return {
    ok: true,
  };
});

await toPromise(
  createActor(machine, {
    input: {},
  }).start(),
);

await toPromise(
  createActor(machine, {
    input: {},
  }).start(),
);
await toPromise(
  createActor(machine, {
    input: {},
  }).start(),
);
await toPromise(
  createActor(machine, {
    input: {},
  }).start(),
);
await toPromise(
  createActor(machine, {
    input: {},
  }).start(),
);

await toPromise(
  createActor(machine, {
    input: {},
  }).start(),
);
await toPromise(
  createActor(machine, {
    input: {},
  }).start(),
);
await toPromise(
  createActor(machine, {
    input: {},
  }).start(),
);
await toPromise(
  createActor(machine, {
    input: {},
  }).start(),
);

await toPromise(
  createActor(machine, {
    input: {},
  }).start(),
);
await toPromise(
  createActor(machine, {
    input: {},
  }).start(),
);
await toPromise(
  createActor(machine, {
    input: {},
  }).start(),
);
await toPromise(
  createActor(machine, {
    input: {},
  }).start(),
);

await toPromise(
  createActor(machine, {
    input: {},
  }).start(),
);
await toPromise(
  createActor(machine, {
    input: {},
  }).start(),
);
await toPromise(
  createActor(machine, {
    input: {},
  }).start(),
);
