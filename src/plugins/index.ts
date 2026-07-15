import DragAndScroll from './drag-and-scroll/index.ts';
import LenisRender from './lenis-render/index.ts';
import NativeRender from './native-render/index.ts';
import Scrollbars from './scrollbars/index.ts';
import StartStop from './start-stop/index.ts';
import VirtualRender from './virtual-render/index.ts';

export type { DragAndScrollOptions } from './drag-and-scroll/types.ts';
export type { LenisRenderOptions } from './lenis-render/types.ts';
export type { NativeRenderOptions } from './native-render/types.ts';
export { TRACK, type ScrollbarsOptions, type Track } from './scrollbars/types.ts';
export type { StartStopOptions } from './start-stop/types.ts';
export type { VirtualRenderOptions } from './virtual-render/types.ts';

const plugins: {
  DragAndScroll: typeof DragAndScroll;
  LenisRender: typeof LenisRender;
  NativeRender: typeof NativeRender;
  Scrollbars: typeof Scrollbars;
  StartStop: typeof StartStop;
  VirtualRender: typeof VirtualRender;
} = {
  DragAndScroll,
  LenisRender,
  NativeRender,
  Scrollbars,
  StartStop,
  VirtualRender,
};

export { DragAndScroll, LenisRender, NativeRender, Scrollbars, StartStop, VirtualRender };

export default plugins;
