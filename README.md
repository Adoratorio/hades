### Hades
A smooth scrollbar with optional native scroll or section implementation for performance boosting

#### Installation and usage
Hades is written in typescript and available as npm package with the alongside types definitions. So install as always

```sh
 npm install --save @adoratorio/hades
```

Then it can be required or imported as module

```javascript
import Hades from '@adoratorio/hades';
```

Internally Hades is using other Adoratorio packages like [Hermes]() for scroll event handling and normalizatino and [Aion]() for requestAnimationFrame management so also those packages documentations are worth to checkout.

When instantiated the constructor take the following options

**NOTE a lot of them are not working in native or fake mode, and only works in virtual mode**

**mode**: A string indicating the scroll mode you wish to use, it can be 'virtual', 'native' or 'fake' also 
static enumerators are exposed to help: `Hades.MODE.VIRTUAL`, `Hades.MODE.NATIVE`, `Hades.MODE.FAKE`. *default to: `Hades.MODE.VIRTUAL`*

**viewport**: The node in the DOM used to identify the wrapper for the translated DOM node (usually a fixed height node)
with `overflow: hidden` for the **VIRTUAL** mode. In case of the **NATIVE** or **FAKE** modes, is the scroll container used to detect scroll events. *default to: `document.querySelector('.hades-viewport')`*

**container**: The node translated when the user scrolls. *default to: document.querySelector('.hades-container')* **_Only in VIRTUAL mode_**

**easing**: A function used to bend the progress in time to match a curve and create more natural scrolling intertia the function is called with only one parameter being the time nomralized in relation with the total duration (currentTime / totalDuration) so the value is goint from 0 to a max of 1. Eg. for a linear time `function(t) { return t; }`. It's always a advised to use a linear-in eased-out timing function to avoid weird visual artifacts when the scroll starts. Some enumerators are exposed, just for having a bounch of useful functions out of the box: `Hades.EASING.LINEAR, Hades.EASING.QUAD, Hades.EASING.CUBIC, Hades.EASING.QUART, Hades.EASING.QUINT`. If you wish BezierEasing from [bezier-easing npm package](https://npmjs.com/package/bezier-easing) can be used as easing function. *default to: `Hades.EASING.LINEAR`*

**duration**: The total lasting duration of the scrolling inertia after the user has stopped scrolling. Expressed in *ms*. *default to: `1000`*

**infiniteScroll**: Whether or not the boundries are taken in account when checking the scroll amount, resulting in an infinite scrolling on all axis. *default to: `false`*

**emitGlobal**: If you want the custom scroll generated internally also emitted on global scope (window). *default to: `false`*

**callback**: The function called on each scroll event, the [HadesEvent]() is passed to this function. *default to: `() => {}`*

**renderByPixel**: Used if you want to apply integer rounded values to the css transition units. If not the full value is used instead resulting in maybe a smoother slow animations avoiding that much stattering in particular in the end of the animation, but it's performance consuming. *default to: `false`*
