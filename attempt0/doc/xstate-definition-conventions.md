# Conventions on project related to xstate

## Compromise between code reusability and xstate-editor inferring

> So the main problem is the full developer freedom in code organization and
> especially usage of dynamic declarations, utility function etc. all these
> stuff break the xstate editor feature. And though it is may still correct and
> even more readable code - the editor is too sweet feature of xstate to ignore
> it.

1. The `x` variable should declare all reusable variables that are used in
   machine
2. It should be static constant object
3. The flat declaration of the states (any logic about where and how deep they
   will be used in machine)
4. That's why they naturally becomes unique
5. That's why `target` in transition can always use `id` but not related path

#### Detailed map of it's properties:

- `.id` for id of the current machine
- `.about` for the it's description
- `.event` the dictionary of the events names (key === value)
- `.[EXAMPLE]` some state
  - `.name` obviously the name of the state, but because it is actually the
    value - it should be PascalCased version of parent key, so here it should be
    `Example`
  - `.ref` this is the name with `#` prefix, used to reference this state in
    transitions

#### Example

```ts
import { setup } from "xstate";

const x = {
  id: "Audio player machine",
  about:
    "This is a demo of some conventions that can be really helpful during xstate usage",
  IDLE: {
    name: "Idle",
    ref: "#Idle",
    description: "The initial and fallback state of the machine.",
  },
  PLAY: {
    name: "Play",
    ref: "#Play",
    description: "The process of the playing",
  },
  event: {
    play: "play",
    exit: "exit",
  },
};
export const machine = setup({})
  .createMachine({
    id: x.id,
    description: x.about,
    states: {
      [x.IDLE.name]: {
        id: x.IDLE.name,
        description: x.IDLE.description,
        on: {
          [x.event.play]: {
            target: x.PLAY.ref,
          },
        },
      },
      [x.PLAY.name]: {
        id: x.PLAY.name,
        description: x.PLAY.description,
      },
    },
    initial: x.IDLE.name,
    on: {
      [x.event.exit]: x.IDLE.ref,
    },
  });
```
