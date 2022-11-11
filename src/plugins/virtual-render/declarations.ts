import Boundaries from "../../Boundaries";

export interface VirtualRenderOptions {
  scrollNode : HTMLElement,
  lockX : boolean,
  lockY : boolean,
  renderScroll : boolean,
  infiniteScroll: boolean,
  boundaries : Boundaries,
  autoBoundaries: boolean,
  precision : number,
}