# DragAndScroll

`DragAndScroll` is a plugin for `Hades` that will allow desktop browser to scroll using drag gestures. It is used on website where dragging an element needs to move the Hades scroll. *`DragAndScroll` automatically manages touch devices, and prevent the attachment of the events on those devices*.

## Available options
`DragAndScroll` accepts in the constructor an option object with the following possible props.

| parameter | type | default | description |
| :- | :-: | :-: | :- |
| proxyNode | `null \| HTMLElement \| Window` | `null` | The DOM element or window on which the plugin will attach the mouse events listeners. If null default context root node will be used. |
| changeCursor | `boolean` | `false` | If the plugin will push the necessary css style to change the cursor with 'grab' and 'grabbing' accordingly to user inputs |
| multiplier | `number` | `1` | The delta multiplier fot the mouse events |
| autoHandleEvents | `Boolean` | `true` | If the plugin should auto attach events upon registering |
| smooth | `Boolean` | `true` | If the amount is applied immediatly or with intertia |
| invert | `Boolean` | `false` | If you wanto to invert the scroll and drag direction, if ture drag on x will trigger scroll on y and vice versa |

```javascript
import DragAndScroll from '@adoratorio/hades/plugins/drag-and-scroll';

hades.registerPlugin(new DragAndScroll({
  
}));
```

## Public methods

### attach()

Attach mouse events to the proxyNode or to the default context (`Hades`) root node. Works only on non-toch enabled devices.

```typescript
DragAndScrollInstance.attach()
```

### detach()

Detach all the previously attached events.

```typescript
DragAndScrollInstance.detach()
```