import type StartStop from './index.ts';

export interface StartStopOptions {
  scrollNode: HTMLElement | Window;
  emitGlobal: boolean;
  callbacks: {
    start: (instance: StartStop) => void;
    stop: (instance: StartStop) => void;
  };
  precision: number;
  mobileDelay: number;
}
