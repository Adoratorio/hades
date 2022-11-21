# ScrollBars

`ScrollBars` is a plugin for `Hades` that allow you to render native-like scrollbars handlers on the right and bottom screen.

## Available options
`StartStop` accepts in the constructor an option object with the following possible props.

| parameter | type | default | description |
| :- | :-: | :-: | :- |
| viewport | `HTMLElement` | `document.body` | The DOM element to append the scrollbars handlers `div` to |
| tracks | `Array<Track>` | `['y']` | The array of strings ('x' and 'y') to determinate which tracks to use |

```javascript
import ScrollBars from '@adoratorio/hades/plugins/scrollbars';

hades.registerPlugin(new ScrollBars({
  viewport: document.querySelector('#app'),
  tracks: ['x', 'y'],
}));
```
