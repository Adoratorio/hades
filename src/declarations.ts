import Aion from '@adoratorio/aion';

export enum MODE {
  VIRTUAL = 'virtual',
  MIMO = 'mimo',
  NATIVE = 'native',
}

export enum DIRECTION {
  UP = 1,
  DOWN = -1,
  INITIAL = 0,
}

export enum TRACK {
  X = 'x',
  Y = 'y',
}

export interface HadesOptions {
  viewport : HTMLElement,
  container : HTMLElement,
  mimo : Mimo | false,
  easing : Easing,
  infiniteScroll: boolean,
  emitGlobal : boolean,
  callbacks : Callbacks,
  renderByPixel : boolean,
  lockX : boolean,
  lockY : boolean,
  boundaries : Boundaries,
  autoBoundaries : boolean,
  mode : string,
  sections : string | boolean,
  loop: boolean,
  autoplay : boolean,
  aion : Aion | null,
  touchMultiplier : number,
  smoothDirectionChange : boolean,
  renderScroll : boolean,
  scrollbar : ScrollbarOptions | null,
  scale : number,
  uniqueDirection : boolean,
  threshold : Vec2,
  startStopPrecision: number,
}

export interface Boundaries {
  max : Vec2,
  min : Vec2,
}

export interface Vec2 {
  x : number,
  y : number,
}

export interface Timeline {
  start : number,
  duration : number,
  initial : Vec2,
  final : Vec2,
  current : Vec2,
}

export interface Easing {
  mode : Function,
  duration : number,
}

export interface Track {
  wrapper : HTMLElement | null,
  thumb : HTMLElement | null,
  thumbSize : number,
  ratio : number,
  drag : boolean,
}

export interface ScrollbarOptions {
  tracks : Array<TRACK>,
}

export interface Callbacks {
  frame : Function,
  scroll : Function,
}

export interface Mimo {
  viewport : HTMLElement,
  container: HTMLElement,
}