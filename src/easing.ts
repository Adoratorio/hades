export type EasingFunction = (t: number) => number;

export const EASINGS: Record<'LINEAR' | 'QUAD' | 'CUBIC' | 'QUART' | 'QUINT', EasingFunction> = {
  LINEAR: (t: number): number => t,
  QUAD: (t: number): number => t * (2 - t),
  CUBIC: (t: number): number => {
    const shifted = t - 1;
    return shifted * shifted * shifted + 1;
  },
  QUART: (t: number): number => {
    const shifted = t - 1;
    return 1 - shifted * shifted * shifted * shifted;
  },
  QUINT: (t: number): number => {
    const shifted = t - 1;
    return 1 + shifted * shifted * shifted * shifted * shifted;
  },
};
