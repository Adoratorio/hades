import type AionModule from '@adoratorio/aion';
import { type HermesEvent } from '@adoratorio/hermes/dist/declarations.js';
import { type EasingFunction } from './easing.ts';
import type Hades from './index.ts';

export { type HermesEvent };

// `@adoratorio/aion` ships legacy CJS-style typings, so under NodeNext the
// default import is typed as the module namespace: the instance type is
// re-derived from its `default` member (bundlers resolve the real ESM class).
export type Aion = InstanceType<(typeof AionModule)['default']>;

export const DIRECTION = {
  UP: 1,
  DOWN: -1,
  INITIAL: 0,
} as const;

export type DIRECTION = (typeof DIRECTION)[keyof typeof DIRECTION];

export interface HadesOptions {
  root: HTMLElement | Window;
  easing: Easing;
  autoplay: boolean;
  aion: Aion | null;
  globalMultiplier: number;
  touchMultiplier: number;
  smoothDirectionChange: boolean;
  threshold: Vec2;
  invert: boolean;
  precision: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Timeline {
  start: number;
  duration: number;
  initial: Vec2;
  final: Vec2;
  current: Vec2;
}

export interface Easing {
  mode: EasingFunction;
  duration: number;
}

export interface HadesPlugin {
  // The plugin id assigned during registration
  id?: string;
  // A name to identify the plugin
  name: string;
  // Called when the plugin is registered
  register?: (context: Hades) => void;
  // Called every wheel event (can return true to prevent proceeding)
  wheel?: (context: Hades, event: HermesEvent) => boolean;
  // Called at the start of scroll handler
  preScroll?: (context: Hades, event: HermesEvent) => void;
  // Called at the end of scroll handler
  scroll?: (context: Hades, event: HermesEvent) => void;
  // Called at the start of frame handler
  preFrame?: (context: Hades) => void;
  // Called at the end of frame handler for render
  render?: (context: Hades) => void;
  // Called when the plugin is unregistered or the main Hades instance is destroyed
  destroy?: () => void;
  // Called inside the scrollTo function if not prevented
  scrollTo?: (context: Hades, position: Partial<Vec2>, duration: number) => void;
  // Called every time the play method is called on context
  play?: (context: Hades) => void;
  // Same as per play but when the context is paused
  pause?: (context: Hades) => void;
}
