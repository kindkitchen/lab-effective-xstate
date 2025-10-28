import { setup } from "xstate";

export const machine = setup({})
  .createMachine({
    id: "Coffee machine",
    states: {
      "History": {
        type: "history",
      },
      "Idle": {
        on: {
          start: {
            target: ".Select drink",
          },
        },
      },
      "Select drink": {},
      "Waiting for payment": {},
    },
    initial: "Idle",
    on: {
      exit: ".Idle",
      back: ".History",
    },
  });
