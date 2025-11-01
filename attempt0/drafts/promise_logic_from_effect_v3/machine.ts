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

type Ctx = {
  Actor: {
    demo: (num: number) => Effect.Effect<"Int: odd" | "Int: even", "Float">;
  };
  num: number;
};
type Input = {
  Actor: Ctx["Actor"];
  num: number;
};

const machine = setup({
  types: {
    input: {} as Input,
    context: {} as Ctx,
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
        input: ({ context }) => [context, context.num] as const,
        onDone: {
          actions: ({ event }) => console.log(event.output),
        },
        onError: {
          actions: ({ event }) => console.error("catched:", event.error),
        },
      },
      after: {
        200: x.DONE.ref,
      },
    },
    [x.DONE.name]: {
      id: x.DONE.name,
      type: "final",
    },
  },
  context: ({ input }) => {
    return {
      Actor: input.Actor,
      num: input.num,
    };
  },
});

for (let i = 0; i < 20; i += 0.5) {
  console.log("i", i);
  const actor = createActor(machine, {
    input: {
      num: i,
      Actor: {
        demo: (num) =>
          Effect.gen(function* () {
            console.log("num", num);
            if (Date.now() % 3) {
              throw new Error("BOOM!!!");
            }

            if (!Number.isInteger(num)) {
              yield* Effect.fail("Float" as const);
            }

            if (num % 2 === 0) {
              return "Int: even" as const;
            } else {
              return "Int: even" as const;
            }
          }),
      },
    },
  });

  await toPromise(actor.start());
}
