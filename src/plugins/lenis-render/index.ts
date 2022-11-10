import Hades from "../..";
import { HadesPlugin } from "../../declarations";
import { LenisRenderOptions } from "./declarations";

class LenisRender implements HadesPlugin {
  private options : LenisRenderOptions;

  constructor(options : LenisRenderOptions) {
    this.options = options;

    if (typeof this.options.container === 'undefined') {
      throw new Error('Invalid container for Lenis Renderer');
    }
  }

  wheel(context : Hades, event : WheelEvent) {
    event.preventDefault();
  }

  render(context : Hades) {
    this.options.container.scrollTo({
      left: context.amount.x,
      top: context.amount.y
    });
  }
}

export default LenisRender;
