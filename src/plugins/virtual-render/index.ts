import Hades from "../..";
import { HadesPlugin } from "../../declarations";
import { VirtualRenderOptions } from "./declarations";

class VirtualRender implements HadesPlugin {
  options : VirtualRenderOptions;

  constructor(options : Partial<VirtualRenderOptions>) {
    const defaults : VirtualRenderOptions = {
      container: document.querySelector('.hades-container') as HTMLElement,
      viewport: document.querySelector('.hades-viewport') as HTMLElement,
      lockX: true,
      lockY: false,
      renderScroll: true,
    };
    this.options = { ...defaults, ...options };

    this.options.container.style.webkitBackfaceVisibility = 'hidden';
    this.options.container.style.backfaceVisibility = 'hidden';
  }

  render(context : Hades) : void {
    const px = this.options.lockX ? 0 : context.amount.x * -1;
    const py = this.options.lockY ? 0 : context.amount.y * -1;
    const prop = `translate3d(${px}px, ${py}px, 0px)`;

    if (this.options.renderScroll) {
      this.options.container.style.transform = prop;
    }
  }

  public startRender() : void {
    this.options.renderScroll = true;
  }

  public stopRender() : void {
    this.options.renderScroll = false;
  }
}

export default VirtualRender;
