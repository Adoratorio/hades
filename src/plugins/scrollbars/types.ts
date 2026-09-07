export const TRACK = {
  X: 'x',
  Y: 'y',
} as const;

export type TRACK = (typeof TRACK)[keyof typeof TRACK];

export interface Track {
  axis: TRACK;
  wrapper: HTMLElement;
  thumb: HTMLElement;
  // Track length along its axis (px)
  length: number;
  // Current thumb length along the axis (px)
  thumbSize: number;
  // Scrollable amount the thumb size was last computed for
  max: number;
  ratio: number;
  shown: boolean;
}

export interface ScrollbarsOptions {
  viewport: HTMLElement;
  tracks: TRACK[];
  // Minimum thumb length (px)
  minThumbSize: number;
}
