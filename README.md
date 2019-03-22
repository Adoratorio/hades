### Hades
A smooth scrollbar with optional native scroll or section implementation for performance boosting

#### Installation and usage
Hades is written in typescript and available as npm package with the alongside types definitions. So install as always

```
 npm install --save @adoratorio/hades
```

Then it can be required or imported as module

```javscript
import Hades from '@adoratorio/hades';
```

When instantiated the constructor take the following options

**NOTE a lot of them are not working in native or fake mode, and only works in virtual mode**

**mode**: A string indicating the scroll mode you wish to use, it can be 'virtual', 'native' or 'fake' also 
static enumerators are exposed to help: `Hades.MODE.VIRTUAL`, `Hades.MODE.NATIVE`, `Hades.MODE.FAKE`.
**viewport**: The node in the DOM used to identify the wrapper for the translated DOM node (usually a fixed height node)
with `overflow: hidden`
**container**