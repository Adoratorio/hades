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
