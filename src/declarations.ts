import Aion from '@adoratorio/aion';
import Boundries from './Boundaries';

export enum DIRECTION {
  UP = 1,
  DOWN = -1,
  INITIAL = 0,
}

export interface HadesOptions {
  root : HTMLElement | Window,
  easing : Easing,
  autoplay : boolean,
  aion : Aion | null,
  globalMultiplier : number,
  touchMultiplier : number,
  smoothDirectionChange : boolean,
  threshold : Vec2,
  invert : boolean,
  precision : number,
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
  id? : string,          // The plugin id assigned during registration
  name : string,         // A name to identify the plugin
  register? : Function,  // Called when the plugin is registerd
  wheel? : Function,     // Called every wheel event (can return to prevent proceeding)
  preScroll? : Function, // Called at the start of scroll handler
  scroll? : Function,    // Called at the end of scroll handler
  preFrame? : Function,  // Called at the start of frame handler
  render? : Function,    // Called at the end of frame handler for render
  destroy? : Function,   // Called when the main Hades instance is destroyed
  scrollTo? : Function,  // Called inside the scroll to function if not prevented
}
