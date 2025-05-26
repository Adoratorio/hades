export enum TRACK {
  X = 'x',
  Y = 'y',
}

export interface Track {
  wrapper: HTMLElement | null,
  thumb: HTMLElement | null,
  thumbSize: number,
  ratio: number,
  drag: boolean,
}

export interface ScrollbarsOptions {
  viewport: HTMLElement,
  tracks: Array<TRACK>,
}