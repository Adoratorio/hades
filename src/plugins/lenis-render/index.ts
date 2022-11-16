import { HermesEvent } from "@adoratorio/hermes/dist/declarations";
import Hades from "../..";
import { HadesPlugin } from "../../declarations";
import { LenisRenderOptions } from "./declarations";

class LenisRender implements HadesPlugin {
  private context : Hades | null = null;
  private options : LenisRenderOptions;
  private nativeScrollHandler : EventListenerOrEventListenerObject;
  private isWheelScroll : boolean = false;

  public name : string = 'LenisRender';

  constructor(options : Partial<LenisRenderOptions>) {
    const defaults : LenisRenderOptions = {
      scrollNode: window,
      renderScroll: true,
    };
    this.options = { ...defaults, ...options };
    this.nativeScrollHandler = (e : Event) => this.nativeScroll(e);

    if (typeof this.options.scrollNode === 'undefined') {
      throw new Error('Invalid Scroll Node for Lenis Renderer');
    }

    this.options.scrollNode.addEventListener('scroll', this.nativeScrollHandler);
  }

  public register(context : Hades) : void {
    this.context = context;
  }

  public wheel(context : Hades, event : HermesEvent) : void {
    if (event.type === 'wheel') {
      event.originalEvent.preventDefault();
      this.isWheelScroll = true;
    } else {
      this.isWheelScroll = false;
    }
  }

  public render(context : Hades) : void {
    if (this.options.renderScroll && this.isWheelScroll) {
      this.options.scrollNode.scrollTo(context.amount.x, context.amount.y);
    }
  }

  public scroll(context : Hades) : void {
    // Clamp the external temp  to be inside the boundaries if not infinite scrolling
    const node = this.options.scrollNode === window ? document.body : this.options.scrollNode;
    const bound = {
      x: (node as HTMLElement).scrollWidth - window.innerWidth,
      y: (node as HTMLElement).scrollHeight - window.innerHeight,
    };
    context.internalTemp = {
      x: Math.min(Math.max(context.internalTemp.x, 0), bound.x),
      y: Math.min(Math.max(context.internalTemp.y,0), bound.y),
    }
  }

  private nativeScroll(event : Event) : void {
    if (this.context && !this.isWheelScroll) {
      const propX = this.options.scrollNode === window ? 'scrollX' : 'scrollLeft';
      const propY = this.options.scrollNode === window ? 'scrollY' : 'scrollTop';
      this.context.scrollTo({
        x: (this.options.scrollNode as any)[propX],
        y: (this.options.scrollNode as any)[propY],
      }, 0, true);
    }
  }

  public destroy(context : Hades) {
    this.options.scrollNode.removeEventListener('scroll', this.nativeScrollHandler);
  }

  public startRender() : void {
    this.options.renderScroll = true;
  }

  public stopRender() : void {
    this.options.renderScroll = false;
  }
}

export default LenisRender;
