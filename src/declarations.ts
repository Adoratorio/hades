import Aion from '@adoratorio/aion';

export enum MODE {
  VIRTUAL = 'virtual',
  FAKE = 'fake',
  NATIVE = 'native',
}

export enum DIRECTION {
  UP = 1,
  DOWN = -1,
  INITIAL = 0,
}

export interface HadesOptions {
  viewport : HTMLElement,
  container : HTMLElement,
  easing : Function,
  duration : number,
  infiniteScroll: boolean,
  emitGlobal : boolean,
  callback : Function,
  renderByPixel : boolean,
  lockX : boolean,
  lockY : boolean,
  boundries : Boundries,
  autoBoundries : boolean,
  mode : string,
  sections : string | boolean,
  autoplay : boolean,
  aion : Aion | null,
  touchMultiplier : number,
  smoothDirectionChange : boolean,
  renderScroll : boolean,
}

export interface Boundries {
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