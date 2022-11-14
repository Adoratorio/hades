export interface StartStopOptions {
  emitGlobal : boolean,
  callbacks : {
    start : Function,
    stop : Function,
  },
  precision : number,
}