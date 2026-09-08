# LenisRender

`LenisRender` is a plugin for `Hades` that will handle the rendering using a native `scrollTo` technique originally implemented in [Lenis](https://lenis.studiofreight.com/). This will apply the `Hades` amount only on `wheel` event so every other event will be left as native as it is and handled by browser. This renderer will also take care to synchronize the `Hades` internal amount with the current native scroll of the element.

## Available options

`LenisRender` accepts in the constructor an option object with the following possible props.

| parameter    |          type           | default  | description                                                                     |
| :----------- | :---------------------: | :------: | :------------------------------------------------------------------------------ |
| scrollNode   | `HTMLElement \| Window` | `window` | The DOM element or window on which the renderer will call the native `scrollTo` |
| renderScroll |        `boolean`        |  `true`  | If the render is applied or not                                                 |

```typescript
import { LenisRender } from '@adoratorio/hades/plugins';

hades.registerPlugin(
  new LenisRender({
    scrollNode: window,
    renderScroll: true,
  }),
);
```

## Public methods

### startRender()

Change the plugin rendering status to `true` so it will apply the amount

```typescript
lenisRenderInstance.startRender();
```

### stopRender()

Change the plugin rendering status to `false` so it will NOT apply the amount

```typescript
lenisRenderInstance.stopRender();
```

### swapScrollNode()

Swap the DOM element (or `window`) the renderer drives at runtime, e.g. after a client-side route change. Re-binds the native `scroll` listener and the `ResizeObserver` to the new node and recomputes the boundaries.

```typescript
const node = document.querySelector<HTMLElement>('.new-container');
if (node) lenisRenderInstance.swapScrollNode(node);
```

### recalculate()

Call `lenisRenderInstance.recalculate()` to refresh cached bounds immediately after layout changes that are not reported by the observers.

## State and lifecycle

`scrollNode` is a read-only `HTMLElement | Window`; use `swapScrollNode(node)` to change it. `boundaries` is a read-only `Boundaries` object containing `min` and `max` vectors. `startRender()`, `stopRender()`, `swapScrollNode(node)`, `recalculate()` and `destroy()` return `void`.

Hades calls `register(context)`, `wheel(context, event)`, `preFrame()`, `render(context)`, `scroll(context, event)` and `scrollTo(context)` as lifecycle hooks. `scrollTo()` defaults to the registered context when called directly. Use `hades.scrollTo()` for normal programmatic scrolling. `destroy()` removes native listeners and observers; unregister the plugin through Hades to remove it from the frame loop.
