import Aion from '@adoratorio/aion';
import Boundries from './Boundaries';

export enum DIRECTION {
  UP = 1,
  DOWN = -1,
  INITIAL = 0,
}

export interface HadesOptions {
  root : HTMLElement,
  easing : Easing,
  autoplay : boolean,
  aion : Aion | null,
  touchMultiplier : number,
  smoothDirectionChange : boolean,
  scale : number,
  threshold : Vec2,
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

export interface HadesPlugin {
  register? : Function,   // Called when the plugin is registerd
  wheel? : Function,     // Called every wheel event
  preScroll? : Function, // Called at the start of scroll handler
  scroll? : Function,    // Called at the end of scroll handler
  preFrame? : Function,  // Called at the start of frame handler
  render? : Function,    // Called at the end of frame handler for render
  destroy? : Function,   // Called when the main Hades instance is destroyed
}
