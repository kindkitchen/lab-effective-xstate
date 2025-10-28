import { Context, Effect, Either, Layer } from "effect";
import { assign, createActor, setup, toPromise } from "xstate";
import { promise_logic_from_effect } from "./promise_logic_from_effect.ts";
import { expect } from "@std/expect";

class A extends Context.Tag("A")<A, { make_a: () => "a" | "A" }>() {}
class B extends Context.Tag("B")<B, { make_b: () => "b" | "B" }>() {}

const demo = (message: string) =>
  Effect.gen(function* () {
    const { make_a } = yield* A;
    const { make_b } = yield* B;
    const a = make_a();
    const b = make_b();
    const a_is_lower = a !== "A";
    const b_is_lower = b === "b";
    const is_same_case = a_is_lower === b_is_lower;

    if (!is_same_case) {
      throw new Error(
        "a & b services should be the same case!" as const,
      );
    }

    if (a.toLowerCase() !== "a") {
      yield* Effect.fail("unexpected value for letter 'a'");
    }

    if (b.toLowerCase() !== "b") {
      yield* Effect.fail("unexpected value for letter 'b'");
    }

    return {
      title: `${a}${b}:`,
      message: a_is_lower ? message.toLowerCase() : message.toUpperCase(),
    };
  });

const machine = setup({
  actors: {
    demo: promise_logic_from_effect(demo),
  },
  guards: {
    is_demo_failed: (_, output: Either.Either<unknown, unknown>) => {
      const is = Either.isLeft(output);
      return is;
    },
  },
  actions: {
    assign_output: assign({ output: (_, value) => value }),
  },
  types: {
    context: {} as {
      A: Layer.Layer<A>;
      B: Layer.Layer<B>;
      output?: unknown;
    },
    input: {} as {
      deps: [Layer.Layer<A>, Layer.Layer<B>];
    },
    output: {} as { message: string },
  },
}).createMachine({
  context: ({ input }) => {
    return {
      A: input.deps[0],
      B: input.deps[1],
    };
  },
  output: ({ context }) => {
    if (typeof context.output === "string") {
      return { message: context.output };
    }

    return { message: "wtf?" };
  },
  initial: "Init",
  states: {
    Init: {
      invoke: {
        src: "demo",
        input: ({ context }) => ({
          args: ["hello world"],
          layer: Layer.mergeAll(
            context.A,
            context.B,
          ),
        }),
        onDone: [
          {
            guard: {
              type: "is_demo_failed",
              params: ({ event }) => event.output,
            },
            target: "#ShowException",
          },
          {
            target: "#ShowSuccess",
          },
        ],
        onError: {
          target: "#ShowError",
        },
      },
    },
    Ok: {
      always: {
        target: "Done",
        actions: {
          type: "assign_output",
          params: "ok!",
        },
      },
      id: "ShowSuccess",
    },
    Done: {
      id: "done",
      type: "final",
    },
    Nok: {
      onDone: { target: "Done" },
      initial: "Error",
      states: {
        Exception: {
          always: { target: "#done" },
          entry: {
            type: "assign_output",
            params: "oops!",
          },
          id: "ShowException",
        },
        Error: {
          always: { target: "#done" },
          entry: {
            type: "assign_output",
            params: "how?",
          },
          id: "ShowError",
        },
      },
    },
  },
});

Deno.test("promise_logic_from_effect", async (t) => {
  for (
    const { name, input, expected } of [
      {
        name: "all should be ok",
        input: {
          deps: [
            Layer.succeed(A, {
              make_a: () => "a",
            }),
            Layer.succeed(B, {
              make_b: () => "b",
            }),
          ] as const,
        },
        expected: "ok!",
      },
      {
        name: "a & B, different cases should throw error (uncontrolled)",
        input: {
          deps: [
            Layer.succeed(A, {
              make_a: () => "a",
            }),
            Layer.succeed(B, {
              make_b: () => "B",
            }),
          ] as const,
        },
        expected: "how?",
      },
      {
        name: "no 'a'/'A' value case should produce exception (controlled)",
        input: {
          deps: [
            Layer.succeed(A, {
              make_a: () => "c" as any,
            }),
            Layer.succeed(B, {
              make_b: () => "b",
            }),
          ] as const,
        },
        expected: "oops!",
      },
    ]
  ) {
    await t.step(`Scenario when ${name}`, async () => {
      const actor = createActor(machine, {
        input: {
          deps: [
            input.deps[0],
            input.deps[1],
          ],
        },
      });

      actor.start();
      await toPromise(actor);

      expect(actor.getSnapshot().output?.message).toBe(expected);
    });
  }
});
