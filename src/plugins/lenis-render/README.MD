# LenisRender

`LenisRender` is a plugin for `Hades` that will handle the rendering using a native `scrollTo` teqnique experimented and implemented originally in [Lenis](https://lenis.studiofreight.com/)). This will apply the `Hades` amount only on `wheel` event so every other event will be left as native as it is and handled by browser. This renderer will also take care to syncronize the `Hades` internal amount with the current native scroll of the element.

## Available options
`LenisRender` accepts in the constructor an option object with the following possible props.

| parameter | type | default | description |
| :- | :-: | :-: | :- |
| scrollNode | `HTMLElement \| Window` | `window` | The DOM element or window on which the renderer will call the native `scrollTo` |
| renderScroll | `boolean` | `true` | If the render is applied or not |

```javascript
import LenisRender from '@adoratorio/hades/plugins/lenis-render';

hades.registerPlugin(new LenisRender({
  scrollNode: window,
  renderScroll: true,
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