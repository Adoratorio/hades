# VirtualRender

`VirtualRender` is a plugin for `Hades` that will handle the rendering using a `transform: translate(...)` property on the `scrollNode` element.

## Available options
`VirtualRender` accepts in the constructor an option object with the following possible props.

| parameter | type | default | description |
| :- | :-: | :-: | :- |
| scrollNode | `HTMLElement` | `document.body` | The DOM element to apply the `transform` to |
| lockX | `boolean` | `true` | If the delta on x will be discarded |
| lockY | `boolean` | `false` | If the delta on y will be discarded |
| renderScroll | `boolean` | `true` | If the render is applied or not |
| infiniteScroll | `boolean` | `false` | If the amount will be bounded or not, if false boundaries are taken into account |
| autoBoundaries | `boolean` | `true` | If `true` the boundaries are calculated each frame using the `getBoundingClientRect()` method on the `scrollNode` parent |
| boundaries | `Boundaries` | `{ min: { x: 0, y: 0 }, max: { x: 0, y: 0 } }` | The boundaries to clamp di amount to |
| precision | `number` | `4` | The precision used to round the actual pixel amount to before render |

```javascript
import VirtualRender from '@adoratorio/hades/plugins/virtual-render';

hades.registerPlugin(new VirtualRender({
  scrollNode: document.querySelector('.container'),
}));
```

## Public methods

### startRender()

Change the plugin rendering status to `true` so it will apply the amount

```typescript
lenisRenderInstance.startRender()
```

### stopRender()

Change the plugin rendering status to `false` so it will NOT apply the amount

```typescript
lenisRenderInstance.stopRender()
```

## Instance getters

#### boundaries
• Type `Boundaries`
Get the current boundaries, also autocalculated one.

## Instance setters

#### infiniteScroll
• Type `boolean`
Update the `infiniteScroll` option.

#### boundaries
• Type `Boundaries`
Update the `boundaries` option.