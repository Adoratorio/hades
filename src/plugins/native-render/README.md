# NativeRender

`NativeRender` is a plugin for `Hades` that will only handle the synchronization of the `Hades` amount with the native one and make proxy for some of the `Hades` methods. Everything else will remain native.

## Available options

`NativeRender` accepts in the constructor an option object with the following possible props.

| parameter  |          type           | default  | description                        |
| :--------- | :---------------------: | :------: | :--------------------------------- |
| scrollNode | `HTMLElement \| Window` | `window` | The DOM element or window to proxy |

```typescript
import { NativeRender } from '@adoratorio/hades/plugins';

hades.registerPlugin(
  new NativeRender({
    scrollNode: window,
  }),
);
```

## Instance Getters

#### native

• Type `Vec2`

Get the current native `scrollNode` scroll amount.

## Lifecycle

All constructor options are optional. Hades calls `register(context)` to synchronize its initial state, `render(context)` to track native position, and `scrollTo(context, position)` for programmatic scrolling. The renderer preserves an axis omitted from `position`. Use `hades.scrollTo()` from application code.

`destroy()` removes the native scroll listener and returns `void`. Unregister through `hades.unregisterPlugin(id)` so the renderer also leaves the frame loop.
