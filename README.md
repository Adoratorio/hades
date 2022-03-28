# Hades
A smooth scrollbar with optional native scroll or section implementation for performance boosting

## Installation
Hades is written in typescript and available as npm package with the alongside types definitions. So install as always

```sh
 npm install --save @adoratorio/hades
```

## Usage
Then it can be required or imported as module

```javascript
import Hades from '@adoratorio/hades';
```

Internally Hades is using other Adoratorio packages like [Hermes](https://github.com/Adoratorio/hermes) for scroll event handling and normalization and [Aion](https://github.com/Adoratorio/aion) for requestAnimationFrame management so also those packages documentations are worth to check out.

## Available options
Aion accepts in the constructor an option object with the following possible props.

**NOTE: all options are used only in virtual mode, except of course for the _mode_ one**

| parameter             |                             type                             |                     default                     | description                                                  |
| :-------------------- | :----------------------------------------------------------: | :---------------------------------------------: | :----------------------------------------------------------- |
| aion                  |                        `Aion | null`                         |                     `null`                      | The Aion instance to use within to perform animations and per-frame operations. If passed this instance will be used, instead a new one is created. |
| autoplay              |                          `boolean`                           |                     `true`                      | Autostart the rendering cycle or not.                        |
| mode                  |                           `string`                           |              `Hades.MODE.VIRTUAL`               | A string indicating the scroll mode you wish to use<br />It can be **virtual**, **native** or **fake**.<br />Static enumerators are exposed to help:<br>• `Hades.MODE.VIRTUAL`<br>• `Hades.MODE.NATIVE`<br>• `Hades.MODE.FAKE`<br> ***Note***: Mode fake isn't currently implemented. |
| viewport              |                        `HTMLElement`                         |   `document.querySelector('.hades-viewport')`   | DOM node used to identify the wrapper for the container.<br />Usually it's a fixed height Element with `overflow: hidden` for the **virtual** mode. <br />In case of **native** or **fake** modes, is the scroll container used to detect scroll events. |
| container             |                        `HTMLElement`                         |  `document.querySelector('.hades-container')`   | The node translated when the user scrolls.                   |
| lockX                 |                          `boolean`                           |                     `true`                      | Lock the x axis when detecting scroll events.                |
| lockY                 |                          `boolean`                           |                     `false`                     | Lock the y axis when detecting scroll events.                |
| infiniteScroll        |                          `boolean`                           |                     `false`                     | Whether or not the boundaries are taken in account when checking the scroll amount, resulting in an infinite scrolling on all axis. |
| sections              |                      `boolean | string`                      |                     `false`                     | Wheather to use sections tecnique. Pass the CSS to selector for the sections to activate, if active the translate properties are applied to the sections instead of the whole container, using the correct values to make the sections translating only when they should be in viewport and to make them feel as "normal". This is computationally more expensive due to loops, but will gain in gpu performance 'cause the translation is applied to a smaller "surface". |
| loop                  |                          `boolean`                           |                     `false`                     | If _sections_ and _infiniteScroll_ are enabled you can create an infinite loop of section that cycle continuously.<br> ***Note***: Currently implemented only for X axis (`{ lockX: false, lockY: true}`). |
| boundries             | `{ min: { x: number, y:number },max: { x:number, y:number } }` | `Hades.createBoundries(xMin, xMax, yMin, yMax)` | The scroll max and min amount in the x and y axis. An object containing these properties `{ min: { x: 0, y: 0 }, max: { x: 0, y: 0 } }`. A static utility function is exposed as helper to build the object: `Hades.createBoundries(xMin, xMax, yMin, yMax)`. |
| renderScroll          |                          `boolean`                           |                    `fkalse`                     | Wheather or not to apply the actual CSS transform property, if false the internal amount is kept and exposed for your personal use. |
| callbacks             |                         `Callbacks`                          |     `{frame: () => {}, scroll: () => {} }`      | The _scroll_ function is called each scroll event.<br />The _frame_ function is called every rAF after updating style. |
| emitGlobal            |                          `boolean`                           |                     `false`                     | If you want that the custom-scroll generated internally also emit on global scope (window). |
| startStopPrecision    |                           `number`                           |                       `4`                       | A number to define the precision of the start and stop events. |
| renderByPixel         |                          `boolean`                           |                     `false`                     | Used if you want to apply integer rounded values to the css transition units. If not, the full value is used instead, resulting in a smoother animations, especially the slowest ones, avoiding that much stuttering in particular in the end of the animation, but it's performance consuming. |
| duration              |                           `number`                           |                     `1000`                      | The total lasting duration of the scrolling inertia after the user has stopped scrolling. Expressed in *ms*. |
| easing                |                          `Function`                          |              `Hades.EASING.LINEAR`              | A function used to bend the progress in time to match a curve and create more natural scrolling inertia.<br />The function is called with only one parameter being the time normalized in relation with the total duration (*currentTime / totalDuration*) so the value is going from 0 to 1.<br> Eg. for a linear time `function(t) { return t; }`. It's always a advised to use a linear-in eased-out timing function to avoid weird visual artifacts when the scroll starts. Some enumerators are exposed, just for having a bunch of useful functions out of the box:<br>.`Hades.EASING.LINEAR`<br>. `Hades.EASING.QUAD`<br>. `Hades.EASING.CUBIC`<br>. `Hades.EASING.QUART`<br>. `Hades.EASING.QUINT`<br> If you wish BezierEasing from [bezier-easing npm package](https://npmjs.com/package/bezier-easing) can be used as easing function. |
| touchMultiplier       |                           `number`                           |                      `1.5`                      | A multiplier used for touches delta and speed calculations, passed to Hermes. Reasonable values are between 0.8 and 3 but it's just a suggestion. Higher values will increase the feeling of slippery touch effect. |
| smoothDirectionChange |                          `boolean`                           |                     `false`                     | If true when the scroll direction change the easing setted is kept to help the transition between one direction and the other to feel more interial. On realy smooth easings and high durations this can feel a bit awkward. If false an immediate direction change is applied. |

## APIs
### Static Methods
#### Hades.createBoundries(xMin, xMax, yMin, yMax)
```typescript
Hades.createBoundires(xMin: number, xMax: number, yMin: number, yMax: number): Boundries
```
Create an object suitable for scrollbar boundaries.

### Instance Properties
The Hades instance exposes two main properties:

#### amount 
• Type: `interface Vec2 { x:number, y:number }`
With x and y props exposes the current scroll amount, updated frame-by-frame.

#### velocity
• Type: `interface Vec2 { x:number, y:number }`
With x and y props exposes the current scroll speed, updated frame-by-frame.

### Instance Getters
#### direction
• Type `number`
Get the current direction of the scroll, page moving up is 1 and page moving down is -1. Enumerators are also exposed with `Hades.DIRECTION.UP`, `Hades.DIRECTION.DOWN` and an inert enum is exposed `Hades.DIRECTION.INITIAL`.

#### virtual
• Type `boolean`
Get true if mode is set to virtual or false if not.

#### native
• Type `boolean`
Get true if mode is set to native or false if not.

#### fake
• Type `boolean`
Get true if mode is set to native or false if not.

### Instance Setters
#### easing
• Type `Function`
Set the easing function, use the constructor param for documentation reference.

#### duration
• Type `number`
Set the duration, use the constructor param for documentation reference.

#### infiniteScroll
• Type `boolean`
Set if infinite scroll is used or not, use the constructor param for documentation reference.

### loop
• Type `boolean`
Set if infinite loop is enabled or not, use the constructor param for documentation reference.

#### emitGlobal
• Type `boolean`
Set if global events are emitted or not.

#### touchMultiplier
• Type `number`
Set the touch multiplier passed to Hermes instance.

#### smoothDirectionChange
• Type `boolean`
Set whether to use smooth direction change or not.

#### renderScroll
• Type `boolean`
Set if to apply CSS transform or not.
