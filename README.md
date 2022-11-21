# Hades
A smooth scrollbar with different renderers like virtual or native, and including a modern renderer using scrollTo (Inspired from [Lenis](https://lenis.studiofreight.com/))

## Installation
`Hades` is written in typescript and available as npm package with the alongside types definitions. So install as always

```sh
 npm install --save @adoratorio/hades
```

## Usage
Then it can be required or imported as module

```javascript
import Hades from '@adoratorio/hades';
```

From now on you can instanciate and register plugins to handle the rendering of the amount with different teqniques or to add functionalities. Plugins stucture is explained later.

For the plugins they can also be imported singularly as modules from the `plguins` folder and then registered using the `registerPlugin` method.

```javascript
import VirtualRender from '@/adoratorio/hades/plugins/virtual-render';
hades.registerPlugin(new VirtualRender({ /* ... plugin options */ }));
```

Internally `Hades` is using other Adoratorio packages like [Hermes](https://github.com/Adoratorio/hermes) for scroll event handling and normalization and [Aion](https://github.com/Adoratorio/aion) for requestAnimationFrame management so also those packages documentations are worth to check out.

## Available options
`Hades` accepts in the constructor an option object with the following possible props.

**Note: all options are used only in virtual mode, except of course for the _mode_ one**

| parameter             |                             type                             |                     default                     | description                                                  |
| :-------------------- | :----------------------------------------------------------: | :---------------------------------------------: | :----------------------------------------------------------- |
| root | `HTMLElement \| Window` | `document.body` | The DOM element or window on which the event listeners for Hermes will be atached to |
| easing | `Function` | `Hades.EASING.LINEAR` | A function used to bend the progress over time to match a curve and create more natural scrolling inertia.<br />The function is called with a single parameter being the time normalized in relation with the total duration (`currentTime / totalDuration`) so the value is going from 0 to 1.<br> Eg. for a linear time `function(t) { return t; }`. It's always a advised to use a linear-in eased-out timing function to avoid weird visual artifacts when the scroll starts. <br />[Some enumerators are exposed](#EASING), just for having a bunch of useful functions out of the box.<br />If you wish BezierEasing from [bezier-easing npm package](https://npmjs.com/package/bezier-easing) can be used as easing function. |
| autoplay | `boolean` | `true` | Autostart the rendering cycle or not. |
| aion | `Aion | null` | `null` | The Aion instance to use within to perform animations and per-frame operations. If passed this instance will be used, instead a new one is created. |
| touchMultiplier | `number` | `1.5` | A multiplier for calculating the delta of touches and the speed, passed to [Hermes](https://github.com/Adoratorio/hermes). <br />*Reasonable values are between 0.8 and 3 but it's just a suggestion. <br />Higher values will increase the feeling of slippery touch effect.* |
| smoothDirectionChange | `boolean` | `false` | If `true` when the scroll direction change the easing setted is kept to help the transition between one direction and the other to feel more inertia. <br />*On really smooth easing and high durations this can feel a bit awkward.* <br />If `false` an immediate direction change is applied. |
| scale | `number` | `1` | The multiplier used to scale the event delta for all the events |
| threshold | `Vec2` | `{ x: 0, y: 3 }` | The minimum amount of unsigned delta that will trigger the scroll event |
| invert | `boolean` | `false` | If `true` x and y delta values will be inverted so you can scroll horizontally by moving fingers vertically |

## APIs
### Public Methods

### scrollTo()

Allow to update the internal amount to specific values immediately or during time
```typescript
hades.scrollTo(position : Partial<Vec2>, duration : number, prevent : boolean = false)
```

**Parameters**

| parameter | required | description |
|:---|:---:|:---|
| position | `Partial<Vec2>` | The x and y value to scroll to |
| duration | `number` | The total duration in ms used to reach the position values, 0 for immediate update |
| prevent | `Partial<Vec2>` | If `true` plugins `scrollTo` to won't be called |

### registerPlugin()

Register a plugin inside the current `Hades` instance. Return an array with all the plugins currently registered
```typescript
hades.registerPlugin(plugin : HadesPlugin) : Array<HadesPlugin>
```

**Parameters**

| parameter | required | description |
|:---|:---:|:---|
| plugin | `HadesPlugin` | The instance of the plugin to register |

### getPlugin()

Get instance of a registerd plugin using his name
```typescript
hades.getPlugin(name : String) : HadesPlugin | undefined
```

**Parameters**

| parameter | required | description |
|:---|:---:|:---|
| name | `string` | The name of the plugin to retrive |

### play()

Allow `Hades` to react to events and update the internal amounts correctly

```typescript
hades.play()
```

### pause()

Prenvent `Hades` to react to events until the play is called again (listeners won't be detached)

```typescript
hades.pause()
```

### destroy() 

Unregister all the internal plugins and detach all the events, then remove all internal references to other tools

```typescript
hades.destroy()
```



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
Get the current direction of the scroll.

- Page moving **up** is `1` 
- Page moving **down** is `-1`.

Enumerators are also exposed with `Hades.DIRECTION.UP`, `Hades.DIRECTION.DOWN` and an inert enum is exposed `Hades.DIRECTION.INITIAL`.

#### root
• Type `HTMLElement | Window`
Get the current root node on which the events are attached to

#### still
• Type `boolean`
Indicates if the update is currently changing or if it's still


### Instance Setters

#### easing
• Type `object`
Set the easing object. The object contain two params:

- the easing **mode**
- the easing **duration**

Use the constructor param for the documentation reference of both params

#### touchMultiplier
• Type `number`
Set the touch multiplier passed to `Hermes` instance.

#### smoothDirectionChange
• Type `boolean`
Set whether to use smooth direction change or not.

#### invert
• Type `boolean`
Set whether to invert the scrollin girections between x and y.

## Plugins

Like we said `Hades` on its own now doesen't render any scroll. You need to use one of the default plugins to render the scroll or write one on your own.

A Plugin should implement the `HadesPlugin` interface thath is composed by the name of the plugin as a string and some methods thath you can hook into to create custom logic

### register() 

This hook is called when the plugin is register, as first param you will reiceve the `Hades` instance the plugin has been registered on

```typescript
public register(context : Hades) : void
```

### wheel() 

This hooek is called whenever a scroll event is fired (can be any `Hermes` event like `wheel` or `keydown`)
as firts param you'll reiceve the context (same as register) and as second the `HermesEvent` thath caused the call.
For more info about `HermesEvent` refer to the [Hermes documentation](https://github.com/Adoratorio/hermes).

You can optionally return a boolean value. If true is returned then `Hades` will discard the event and the rest of the logic will be prevented.

```typescript
public wheel(context : Hades, event : HermesEvent) : boolean
```

### preScroll()

This hook is called if the scroll event is processed before any of the `Hades` logic is applied.

```typescript
public preScroll(context : Hades, event : HermesEvent) : void
```

### scroll()

This hook is called if the scroll event is processed after any of the `Hades` logic is applied.
You can manipulate the final amount of the scroll to be passed to the next frame using the `internalTemp : Vec2` property of the context

```typescript
public preScroll(context : Hades, event : HermesEvent) : void
```

### preFrame()

This hook is called at the start of the frame before applying easing logic on scroll values

```typescript
public preFrame(context : Hades) : void
```

### render()

This hook is the core one and is called after all the easing have been applied and here the final values are available to be applied and rendered

```typescript
public render(context : Hades) : void
```

### destroy()

This hook is called when `destroy` is called the main instance of `Hades` and should be used to remove all listeners created and to clean up the plugin internal references.

```typescript
public destroy(context : Hades) : void
```

### scrollTo()

This hook is called when `scrollTo` is called on the main `Hades` instance and will reiceve the context as well as the position and the duration passed to the original metho call.

```typescript
public scrollTo(context : Hades, position : Vec2, duration : number) : void
```