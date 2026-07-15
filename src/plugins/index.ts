import DragAndScroll from './drag-and-scroll/index.ts';
import LenisRender from './lenis-render/index.ts';
import NativeRender from './native-render/index.ts';
import Scrollbars from './scrollbars/index.ts';
import StartStop from './start-stop/index.ts';
import VirtualRender from './virtual-render/index.ts';

export type { DragAndScrollOptions } from './drag-and-scroll/declarations.ts';
export type { LenisRenderOptions } from './lenis-render/declarations.ts';
export type { NativeRenderOptions } from './native-render/declarations.ts';
export { TRACK, type ScrollbarsOptions, type Track } from './scrollbars/declarations.ts';
export type { StartStopOptions } from './start-stop/declarations.ts';
export type { VirtualRenderOptions } from './virtual-render/declarations.ts';

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
