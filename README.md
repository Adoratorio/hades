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

Internally Hades is using other Adoratorio packages like [Hermes]() for scroll event handling and normalizatino and [Aion]() for requestAnimationFrame management so also those packages documentations are worth to checkout.

## Available options
When instantiated the constructor take the following options

**NOTE a lot of them are not working in native or fake mode, and only works in virtual mode**

|parameter|type|default|description|virtual only|
|:-------:|:--:|:-----:|:----------|:----------:|
|mode|`string`|`Hades.MODE.VIRTUAL`|A string indicating the scroll mode you wish to use, it can be 'virtual', 'native' or 'fake' also static enumerators are exposed to help:<br>• `Hades.MODE.VIRTUAL`<br>• `Hades.MODE.NATIVE`<br>• `Hades.MODE.FAKE`.| |
|viewport|`HTMLElement`|`document.querySelector('.hades-viewport')`|The node in the DOM used to identify the wrapper for the translated DOM node (usually a fixed height node) with `overflow: hidden` for the **VIRTUAL** mode. In case of the **NATIVE** or **FAKE** modes, is the scroll container used to detect scroll events.|✔️|
|container|`HTMLElement`|`document.querySelector('.hades-container')`|The node translated when the user scrolls.|✔️|
|easing|`Function`|`Hades.EASING.LINEAR`|A function used to bend the progress in time to match a curve and create more natural scrolling intertia the function is called with only one parameter being the time nomralized in relation with the total duration (currentTime / totalDuration) so the value is goint from 0 to a max of 1. Eg. for a linear time `function(t) { return t; }`. It's always a advised to use a linear-in eased-out timing function to avoid weird visual artifacts when the scroll starts. Some enumerators are exposed, just for having a bounch of useful functions out of the box: `Hades.EASING.LINEAR, Hades.EASING.QUAD, Hades.EASING.CUBIC, Hades.EASING.QUART, Hades.EASING.QUINT`. If you wish BezierEasing from [bezier-easing npm package](https://npmjs.com/package/bezier-easing) can be used as easing function.|✔️|
|duration|`number`|`1000`|The total lasting duration of the scrolling inertia after the user has stopped scrolling. Expressed in *ms*.|✔️|
|infiniteScroll|`boolean`|`false`|Whether or not the boundries are taken in account when checking the scroll amount, resulting in an infinite scrolling on all axis.|✔️|
|emitGlobal|`boolean`|`false`|If you want the custom scroll generated internally also emitted on global scope (window).|✔️|
|callback|`Function`|`() => {}`|The function called on each scroll event, the [HadesEvent]() is passed to this function.|✔️|
|renderByPixel|`boolean`|`false`|Used if you want to apply integer rounded values to the css transition units. If not, the full value is used instead, resulting in a smoother animations, especially the slowest ones, avoiding that much stattering in particular in the end of the animation, but it's performance consuming.|✔️|
|lockX|`boolean`|`true`|Lock the x axis when detecting scroll events.|✔️|
|lockY|`boolean`|`false`|Lock the y axis when detecting scroll events.|✔️|

**boundries**: The scroll max and min amount in the x and y axis. An object containing these properties `{ min: { x: 0, y: 0 }, max: { x: 0, y: 0 } }`. A static utility function is exposed as helper to build the object: `Hades.createBoundries(xMin, xMax, yMin, yMax)`. *detault to: Hades.createBoundries(0, 0, 0, 0)* **_only in VIRTUAL mode_**

**sections**: Wheather to use sections tecnique. Pass the CSS to selector for the sections to activate, if active the translate properties are applied to the sections instead of the whole container, using the correct values to make the sections translating only when they should be in viewport and to make them feel as "normal". This is computationally more expensive due to loops, but will gain in gpu performance 'cause the translation is applied to a smaller "surface". *default to: `false`* **_only in VIRTUAL mode_**

**aion**: The Aion instance to use within to perform animations and per-frame operations. If passed this instance will be used, instead a new one is created. *default to: null* **_only in VIRTUAL mode_**

**autoplay**: Autostart the rendering cycle or not. *deault to: true* **_only in VIRTUAL mode_**

**touchMultiplier**: A multiplier used for touches delta and speed calculations, passed to Hermes. Reasonable values are between 0.8 and 3 but it's just a suggestion. Higher values will increase the feeling of slippery touch effect. *default to: `1.5`* **_only in VIRTUAL mode_**

**smoothDirectionChange**: If true when the scroll direction change the easing setted is kept to help the transition between one direction and the other to feel more interial. On realy smooth easings and high durations this can feel a bit awkward. If false an immediate direction change is applied. *default to: `false`* **_only in VIRTUAL mode_**

**renderScroll**: Wheather or not to apply the actual CSS transform property, if false the internal amount is kept and exposed for your personal use. *default to: `false`* **_only in VIRTUAL mode_**

### Public properties, getters and setters
#### Properties
The Hades instance exposes two main properties:

**amount**: With x and y props exposes the current scroll amount, updated frame-by-frame.
**velocity**: With x and y props exposes the current scroll speed, updated frame-by-frame.

#### Getters
**direction**: Get the current direction of the scroll, page mouving up is 1 and page moving down is -1. Enumerators are also exposed with `Hades.DIRECTION.UP`, `Hades.DIRECTION.DOWN` and an inert enum is exposed `Hades.DIRECTION.INITIAL`.
**virtual**: Get true if mode is setted to virtual or false if not.
**native**: Get true if mode is setted to native or false if not.
**fake**: Get true if mode is setted to native or false if not.

#### Setters
**easing**: Set the easing function, use the constructor param for documentation reference.
**duration**: Set the duration, use the constructor param for documentation reference.
**infiniteScroll**: Set if infinite scroll is used or not, use the constructor param for documentation reference.
**emitGlobal**: Set if global events are emitted or not.
**touchMultiplier**: Set the touch multiplier passed to Hermes instance.
**smoothDirectionChange**: Set whether to use smooth direction change or not.
**renderScroll**: Set if to apply CSS transform or not.
