import { HermesEvent } from "@adoratorio/hermes/dist/declarations";
import Hades from "../..";
import { HadesPlugin } from "../../declarations";
import { LenisRenderOptions } from "./declarations";

class LenisRender implements HadesPlugin {
  private options : LenisRenderOptions;

  constructor(options : LenisRenderOptions) {
    const defaults : LenisRenderOptions = {
      scrollNode: window,
    };
    this.options = { ...defaults, ...options };

    if (typeof this.options.scrollNode === 'undefined') {
      throw new Error('Invalid Scroll Node for Lenis Renderer');
    }

    // Prevent wheel also on the node to be scrolled
    this.options.scrollNode.addEventListener('wheel', (e) => {
      e.preventDefault();
    }, { passive: false });
  }

  wheel(context : Hades, event : HermesEvent) {
    event.originalEvent.preventDefault();
  }

  render(context : Hades) {
    this.options.scrollNode.scrollTo(context.amount.x, context.amount.y);
  }
}

export default LenisRender;
