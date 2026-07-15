export const TRACK = {
  X: 'x',
  Y: 'y',
} as const;

export type TRACK = (typeof TRACK)[keyof typeof TRACK];

export interface Track {
  wrapper: HTMLElement | null;
  thumb: HTMLElement | null;
  thumbSize: number;
  ratio: number;
  drag: boolean;
}

export interface ScrollbarsOptions {
  viewport: HTMLElement;
  tracks: TRACK[];
}
