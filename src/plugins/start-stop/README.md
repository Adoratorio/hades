# StartStop

`StartStop` is a plugin for `Hades` that allow you to listen to scroll states changes, lika start scrolling and stop scrolling.

## Available options

`StartStop` accepts in the constructor an option object with the following possible props.

| parameter   |                  type                   |                default                | description                                                                                                           |
| :---------- | :-------------------------------------: | :-----------------------------------: | :-------------------------------------------------------------------------------------------------------------------- |
| scrollNode  |         `HTMLElement \| Window`         |               `window`                | The same DOM element on which the native scroll is handled by other plugins if any                                    |
| emitGlobal  |                `boolean`                |                `false`                | if the plugin should emit global events or not. If true `hades-start` and `hades-stop` will be emitted on window      |
| callbacks   | `{ start : Function, stop : Function }` | `{ start: () => {}, stop: () => {} }` | An object containing two functions called on start and stop                                                           |
| precision   |                `number`                 |                  `2`                  | The decimals to round to when watching for frame changes in velocity                                                  |
| mobileDelay |                `number`                 |                 `500`                 | On coarse pointers the native scroll position is sampled every `mobileDelay` ms and compared with the previous sample |

```typescript
import { StartStop } from '@adoratorio/hades/plugins';

hades.registerPlugin(
  new StartStop({
    scrollNode: window,
    callbacks: {
      start: () => console.log('start'),
      stop: () => console.log('stop'),
    },
  }),
);
```

## Instance Getters

#### still

• Type `boolean`

Returns `true` when the scroll is settled (not currently moving).
