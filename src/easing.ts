export type EasingFunction = (t: number) => number;

export const EASINGS: Record<'LINEAR' | 'QUAD' | 'CUBIC' | 'QUART' | 'QUINT', EasingFunction> = {
  LINEAR: (t: number): number => t,
  QUAD: (t: number): number => t * (2 - t),
  CUBIC: (t: number): number => --t * t * t + 1,
  QUART: (t: number): number => 1 - --t * t * t * t,
  QUINT: (t: number): number => 1 + --t * t * t * t * t,
};
