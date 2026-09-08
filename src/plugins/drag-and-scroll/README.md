# DragAndScroll

`DragAndScroll` is a plugin for `Hades` that will allow desktop browser to scroll using drag gestures. It is used on website where dragging an element needs to move the Hades scroll. _`DragAndScroll` reacts to mouse pointers only, so touch devices keep their native gestures_. While dragging, text selection and native image dragging are disabled on the node and the pointer is captured, so the drag survives leaving the node.

## Available options

`DragAndScroll` accepts in the constructor an option object with the following possible props.

| parameter        |              type               | default | description                                                                                                                           |
| :--------------- | :-----------------------------: | :-----: | :------------------------------------------------------------------------------------------------------------------------------------ |
| proxyNode        | `null \| HTMLElement \| Window` | `null`  | The DOM element or window on which the plugin will attach the mouse events listeners. If null default context root node will be used. |
| changeCursor     |            `boolean`            | `false` | If the plugin will push the necessary css style to change the cursor with 'grab' and 'grabbing' accordingly to user inputs            |
| multiplier       |            `number`             |   `1`   | The delta multiplier for the mouse events                                                                                             |
| autoHandleEvents |            `boolean`            | `true`  | If the plugin should auto attach events upon registering                                                                              |
| smooth           |            `boolean`            | `true`  | If the amount is applied immediately or with inertia                                                                                  |
| invert           |            `boolean`            | `false` | If you want to invert the scroll and drag direction, if true drag on x will trigger scroll on y and vice versa                        |

```typescript
import { DragAndScroll } from '@adoratorio/hades/plugins';

hades.registerPlugin(
  new DragAndScroll({
    autoHandleEvents: true, // No need to call attach
  }),
);
```

## Public methods

### attach()

Attach pointer listeners to `proxyNode` or the registered Hades root. Only mouse pointers start dragging, including on devices that also support touch. Without an explicit proxy node, register the plugin before calling `attach()`.

```typescript
DragAndScrollInstance.attach();
```

### detach()

Detach all the previously attached events.

```typescript
DragAndScrollInstance.detach();
```

### play(), pause() and destroy()

`play()` updates the cursor to its ready state when cursor changes are enabled; `pause()` ends an active drag and resets the cursor. They do not attach or detach listeners. Hades calls these hooks when its own `play()` and `pause()` methods run, and dragging checks whether Hades is running. Use `attach()` and `detach()` to manage listeners explicitly. `destroy()` detaches listeners and clears the context. All these methods, along with `register(context)`, return `void`.

With `proxyNode: window`, cursor style changes are disabled because the proxy has no element style. `smooth: false` synchronizes the rendered amount immediately; `smooth: true` retains Hades easing.
