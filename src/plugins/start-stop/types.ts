import type StartStop from './index.ts';

export interface StartStopCallbacks {
  start: (instance: StartStop) => void;
  stop: (instance: StartStop) => void;
}

export interface StartStopOptions {
  scrollNode: HTMLElement | Window;
  emitGlobal: boolean;
  callbacks: StartStopCallbacks;
  precision: number;
  mobileDelay: number;
}
