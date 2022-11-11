import { HermesEvent } from "@adoratorio/hermes/dist/declarations";
import Hades from "../..";
import { HadesPlugin } from "../../declarations";
import { LenisRenderOptions } from "./declarations";

class LenisRender implements HadesPlugin {
  private context : Hades | null = null;
  private options : LenisRenderOptions;
  private nativeScrollHandler : EventListenerOrEventListenerObject;
  private renderScroll : boolean = true;

  constructor(options : LenisRenderOptions) {
    const defaults : LenisRenderOptions = {
      scrollNode: window,
    };
    this.options = { ...defaults, ...options };
    this.nativeScrollHandler = (e : Event) => this.nativeScroll(e);

    if (typeof this.options.scrollNode === 'undefined') {
      throw new Error('Invalid Scroll Node for Lenis Renderer');
    }

    this.options.scrollNode.addEventListener('scroll', this.nativeScrollHandler);
  }

  register(context : Hades) {
    this.context = context;
  }

  wheel(context : Hades, event : HermesEvent) {
    event.originalEvent.preventDefault();
  }

  render(context : Hades) {
    if (this.renderScroll) {
      this.options.scrollNode.scrollTo(context.amount.x, context.amount.y);
    }
  }

  nativeScroll(event : Event) {
    // this.renderScroll = false;
    // if (this.context) {
    //   const node = this.options.scrollNode === window ? document.body : this.options.scrollNode;
    //   this.context.scrollTo({
    //     x: (node as HTMLElement).scrollLeft,
    //     y: (node as HTMLElement).scrollTop,
    //   }, 0);
    // }
    // this.renderScroll = true;
  }
}

export default LenisRender;
