import Aion from '@adoratorio/aion';

export enum MODE {
  VIRTUAL = 'virtual',
  FAKE = 'fake',
  NATIVE = 'native',
  AUTO = 'auto',
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
  mode : string,
  sections : boolean,
  autoplay : boolean,
  aion : Aion | null,
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