# Hades

Smooth scrolling with native and virtual renderers, configurable easing and modular plugins.

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
  scrollNode: document.querySelector<HTMLElement>('.container') ?? document.body
}));
```

Internally, Hades uses `@adoratorio/hermes` for scroll event normalization and `@adoratorio/aion` for `requestAnimationFrame` management.

## Configuration

| Parameter | Type | Default | Description |
| :-------- | :--: | :-----: | :---------- |
| `root` | `HTMLElement \| Window` | `document.body` | The DOM element or window on which the event listeners will be attached. |
| `easing` | `Easing` | `{ duration: 1000, mode: Hades.EASING.LINEAR }` | Easing configuration for inertia. Each frame the position moves towards the target by the curve evaluated at `delta / duration`, and settles once closer than 0.01px. |
| `autoplay` | `boolean` | `true` | Enable input handling through `play()` on construction. |
| `aion` | `Aion \| null` | `null` | Share an Aion engine, or create one internally. Hades starts either engine and removes only its own handler on destruction. |
| `touchMultiplier` | `number` | `1.5` | Multiplier for calculating the delta of touches. |
| `smoothDirectionChange`| `boolean` | `false` | Retains easing when changing scroll direction to feel more inertia. When `false` the pending momentum is dropped on an up/down reversal (starting from still is not a reversal). |
| `globalMultiplier` | `number` | `1` | Multiplier used to scale the event delta for all events. |
| `threshold` | `Vec2` | `{ x: 0, y: 3 }` | Minimum unsigned delta triggering a scroll event. |
| `invert` | `boolean` | `false` | Inverts x and y delta values. |
| `precision` | `number` | `4` | Decimal digits used to round computed velocity and rendered values. |
| `debug` | `boolean` | `false` | Enable namespaced `console.warn` diagnostics for recoverable issues (contract violations always throw). Forwarded to the internal `Hermes` and `Aion`. |
| `respectReducedMotion` | `boolean` | Disabled when omitted | Use immediate movement while the system requests reduced motion. |

All constructor options are optional. `easing` and `threshold` accept partial objects. `autoplay` controls input handling through `play()`; the shared frame engine is started even when `autoplay` is false.

### Easing Functions
A set of ready-made easing functions is exposed as `Hades.EASING`.
* `Hades.EASING.LINEAR`
* `Hades.EASING.QUAD`
* `Hades.EASING.CUBIC`
* `Hades.EASING.QUART`
* `Hades.EASING.QUINT`

## Methods

### Scroll & Lifecycle

```text
// Scroll immediately or smoothly to a specific position. Any user input
// interrupts a smooth scrollTo and continues from the rendered position.
hades.scrollTo(position: Partial<Vec2>, duration: number, prevent?: boolean)

// Play or Pause the event reaction
hades.play()
hades.pause()

// Tear down the instance and clean up
hades.destroy()
```

### Scroll parameters

`scrollTo(position, duration, prevent = false)` takes pixels and milliseconds. Supply either axis or both; omitted axes keep their current targets. A duration of zero or less requests immediate movement. Position values and duration must be finite. The third argument skips plugin `scrollTo` hooks when true; it does not prevent browser events. `play()`, `pause()`, `scrollTo()` and `destroy()` return `void`.

### Registering plugins

```text
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
hades.running   // whether input handling is enabled by play()/pause()
hades.root      // resolved listener root (read-only)
```

`direction` is a `Vec2` whose axes use `Hades.DIRECTION.UP` (`1`), `DOWN` (`-1`) or `INITIAL` (`0`). `easing` also accepts a partial update such as `hades.easing = { duration: 600 }`. `internalAmount` and `internalTemp` are get/set `Vec2` properties used by renderer plugins to synchronize target and temporary input positions; normal integrations should use `scrollTo()`.

### Custom plugins

`getPlugin<T>(name)` looks up a plugin by name; `unregisterPlugin(id)` uses its assigned ID, runs its `destroy()` hook and returns `false` if absent. `registerPlugins(plugins, ids = [])` registers in array order. Missing IDs are generated. `getRenderer()` returns the first registered built-in renderer by name, or `undefined`.

`HadesPlugin` requires `name` and accepts an assigned `id`. Its optional hooks are:

| Hook | Arguments | When it runs |
| :--- | :-------- | :----------- |
| `register` | `context: Hades` | Registration. |
| `wheel` | `context, event: HermesEvent` | Input interception; returning true causes Hades to skip its normal processing of that event. |
| `preScroll` | `context, event: HermesEvent` | Before applying accepted input to the scroll target. |
| `scroll` | `context, event: HermesEvent` | After updating the input target. |
| `preFrame` | `context` | Before frame motion is calculated. |
| `render` | `context` | After frame motion is calculated. |
| `scrollTo` | `context, position: Partial<Vec2>, duration: number` | Programmatic scrolling, unless `prevent` is true. |
| `play`, `pause` | `context` | Input handling is enabled or disabled. |
| `destroy` | None | Unregistration or instance destruction. |

Hooks run in registration order within each phase. Frame hooks continue while the instance is still or input handling is paused. See the [plugin contract](src/types.ts) for complete types, including `BoundedRenderer` for renderers exposing `boundaries`.

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

Exported types include `HadesOptions`, `HadesInputOptions`, `HadesPlugin`, `BoundedRenderer`, `Bounds`, `Easing`, `HermesEvent`, `Timeline`, `Aion` and `Vec2`. `Boundaries` is an exported class:

```typescript
import { Boundaries } from '@adoratorio/hades';

const bounds = new Boundaries(0, 0, 0, 1200); // xMin, xMax, yMin, yMax
console.log(bounds.min, bounds.max);
```

## Compatibility

Imports are safe during server-side rendering. Create instances and DOM plugins on the client after mounting. The package targets ES2023 and does not include polyfills.

## Motion and layout

Nested constructor settings may be partial. An easing duration of zero means
immediate movement; negative or non-finite easing durations are rejected.
`respectReducedMotion: true` opts in to immediate movement while the system
requests reduced motion. The default remains the existing easing behavior,
and plugin frame hooks continue running even while the instance is still.

Renderer constructors require a DOM (or an explicit valid node); create them
after mount. `LenisRender.recalculate()` refreshes cached bounds for layout
changes not reported by ResizeObserver or DOM content mutations. Inner native
scrollers consume input while they have room in the requested direction;
input can reach the outer scroller at their boundary. Ctrl+wheel is left to
browser zoom. Built-in scrollbars support arrows, PageUp/PageDown and Home/End.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, checks and pull requests.
Version history is documented in the [changelog](CHANGELOG.md) and [GitHub releases](https://github.com/Adoratorio/hades/releases).

## Maintainers

Maintained by [Adoratorio](https://github.com/Adoratorio).

- [Andrea Gottardi](https://github.com/AndreaGottardi)
- [Daniele Borra](https://github.com/borradaniele)
- [Andrea Biason](https://github.com/biazo5)

Contributor credits are preserved in [package.json](package.json) and the Git history.

## License

[MIT](LICENSE).
