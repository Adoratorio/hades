import type Boundaries from '../../Boundaries.ts';

export interface VirtualRenderOptions {
  scrollNode: HTMLElement;
  lockX: boolean;
  lockY: boolean;
  renderScroll: boolean;
  infiniteScroll: boolean;
  autoBoundaries: boolean;
  boundaries: Boundaries;
  precision: number;
}
