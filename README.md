# Hades

A smooth scrollbar utility featuring different renderers (virtual, native, and Lenis-like hybrid rendering). Inspired by Lenis.

## Installation

```bash
npm install @adoratorio/hades
```

## Usage

This package is ESM-only. Import it as a module:

```typescript
import Hades from '@adoratorio/hades';
import { VirtualRender } from '@adoratorio/hades/plugins';

const hades = new Hades({
  easing: { duration: 1200, mode: Hades.EASING.CUBIC },
  smoothDirectionChange: true,
});

hades.registerPlugin(new VirtualRender({
  scrollNode: document.querySelector('.container')
}));
```

Internally, Hades uses `@adoratorio/hermes` for scroll event normalization and `@adoratorio/aion` for `requestAnimationFrame` management.

## Configuration

| Parameter | Type | Default | Description |
| :-------- | :--: | :-----: | :---------- |
| `root` | `HTMLElement \| Window` | `document.body` | The DOM element or window on which the event listeners will be attached. |
| `easing` | `Easing` | `{ duration: 1000, mode: Hades.EASING.LINEAR }` | Easing configuration for inertia. Each frame the position moves towards the target by the curve evaluated at `delta / duration`, and settles once closer than 0.01px. |
| `autoplay` | `boolean` | `true` | Autostart the rendering cycle. |
| `touchMultiplier` | `number` | `1.5` | Multiplier for calculating the delta of touches. |
| `smoothDirectionChange`| `boolean` | `false` | Retains easing when changing scroll direction to feel more inertia. When `false` the pending momentum is dropped on an up/down reversal (starting from still is not a reversal). |
| `globalMultiplier` | `number` | `1` | Multiplier used to scale the event delta for all events. |
| `threshold` | `Vec2` | `{ x: 0, y: 3 }` | Minimum unsigned delta triggering a scroll event. |
| `invert` | `boolean` | `false` | Inverts x and y delta values. |
| `precision` | `number` | `4` | Decimal digits used to round computed velocity and rendered values. |
| `debug` | `boolean` | `false` | Enable namespaced `console.warn` diagnostics for recoverable issues (contract violations always throw). Forwarded to the internal `Hermes` and `Aion`. |

### Easing Functions
A set of ready-made easing functions is exposed as `Hades.EASING`.
* `Hades.EASING.LINEAR`
* `Hades.EASING.QUAD`
* `Hades.EASING.CUBIC`
* `Hades.EASING.QUART`
* `Hades.EASING.QUINT`

## Methods

### Scroll & Lifecycle

```typescript
// Scroll immediately or smoothly to a specific position. Any user input
// interrupts a smooth scrollTo and continues from the rendered position.
hades.scrollTo(position: Partial<Vec2>, duration: number, prevent?: boolean)

// Play or Pause the event reaction
hades.play()
hades.pause()

// Tear down the instance and clean up
hades.destroy()
```

### Plugin Management

```typescript
// Plugin names must be unique per instance
hades.registerPlugin(plugin: HadesPlugin, id?: string): string
hades.registerPlugins(plugins: HadesPlugin[], ids?: string[]): string[]
hades.unregisterPlugin(id: string): boolean
hades.getPlugin(name: string): HadesPlugin | undefined
hades.getRenderer(): HadesPlugin | undefined
```

### Runtime settings

```typescript
// Getters and setters, applied from the next frame/event on
hades.easing = { mode: Hades.EASING.QUAD, duration: 600 };
hades.touchMultiplier = 2;
hades.smoothDirectionChange = true;
hades.invert = false;

// State
hades.amount     // rendered position (Vec2)
hades.velocity   // px per ms (Vec2)
hades.direction  // Hades.DIRECTION.UP | DOWN | INITIAL per axis
hades.still      // true once the scroll has settled
```

## Shipped Plugins

Importable from `@adoratorio/hades/plugins`:

| Plugin | Purpose |
| :----- | :------ |
| [`VirtualRender`](src/plugins/virtual-render/README.md) | Renders scroll applying `transform: translate3d` on a node. Auto-computes boundaries. |
| [`LenisRender`](src/plugins/lenis-render/README.md) | Drives native position via `scrollTo` and syncs back on native scroll. |
| [`NativeRender`](src/plugins/native-render/README.md) | Pass-through to native scrolling. |
| [`Scrollbars`](src/plugins/scrollbars/README.md) | Injects and manages DOM scrollbar UI. Requires a renderer with boundaries (`VirtualRender` or `LenisRender`) registered first. |
| [`DragAndScroll`](src/plugins/drag-and-scroll/README.md) | Adds click-and-drag scrolling (automatically avoids conflicts on touch devices). |
| [`StartStop`](src/plugins/start-stop/README.md) | Fires callbacks when scrolling starts and settles. |

## Browser Support & SSR

Hades needs `window` and `document`; instantiating it outside of a browser environment throws an error. Create it in a client-only hook when using an SSR framework.

## TypeScript Support

Fully typed. Exported interfaces include `HadesOptions`, `HadesPlugin`, `Vec2`, and `Boundaries`.