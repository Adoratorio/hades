# Scrollbars

`Scrollbars` is a plugin for `Hades` that allow you to render native-like scrollbars handlers on the right and bottom screen.

## Available options

`Scrollbars` accepts in the constructor an option object with the following possible props.

| parameter |        type         |     default     | description                                                           |
| :-------- | :-----------------: | :-------------: | :-------------------------------------------------------------------- |
| viewport  |    `HTMLElement`    | `document.body` | The DOM element to append the scrollbars handlers `div` to            |
| tracks    | `Array<'x' \| 'y'>` |     `['y']`     | The array of strings ('x' and 'y') to determinate which tracks to use |

```typescript
import { Scrollbars } from '@adoratorio/hades/plugins';

hades.registerPlugin(
  new Scrollbars({
    viewport: document.querySelector('#app'),
    tracks: ['x', 'y'],
  }),
);
```
