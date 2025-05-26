export interface StartStopOptions {
  scrollNode: HTMLElement | Window,
  emitGlobal: boolean,
  callbacks: {
    start: Function,
    stop: Function,
  },
  precision: number,
  mobileDelay: number,
}