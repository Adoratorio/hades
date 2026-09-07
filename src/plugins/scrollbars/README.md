# Scrollbars

`Scrollbars` is a plugin for `Hades` that allow you to render native-like scrollbars handlers on the right and bottom screen. It needs a renderer exposing boundaries (`VirtualRender` or `LenisRender`) registered before it. The thumb is sized proportionally to the visible fraction of the content, tracks can be clicked and dragged (pointer events, disabled on touch-only devices) and hide once the scroll settles.

## Available options

`Scrollbars` accepts in the constructor an option object with the following possible props.

| parameter    |        type         |          default           | description                                                                                                                                                        |
| :----------- | :-----------------: | :------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| viewport     |    `HTMLElement`    | `document.documentElement` | The DOM element to append the scrollbars handlers `div` to. Must not be inside the renderer scroll node (the transform would move the scrollbars with the content) |
| tracks       | `Array<'x' \| 'y'>` |          `['y']`           | The array of strings ('x' and 'y') to determinate which tracks to use                                                                                              |
| minThumbSize |      `number`       |            `24`            | Minimum thumb length in px                                                                                                                                         |

```typescript
import { Scrollbars } from '@adoratorio/hades/plugins';

hades.registerPlugin(
  new Scrollbars({
    viewport: document.querySelector('#app'),
    tracks: ['x', 'y'],
  }),
);
```
