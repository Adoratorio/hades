import { HermesEvent } from "@adoratorio/hermes/dist/declarations";
import Hades from "../..";
import { HadesPlugin } from "../../declarations";
import { LenisRenderOptions } from "./declarations";
import { isScrollableElement } from "../../utils";
import Boundaries from "../../Boundaries";

class LenisRender implements HadesPlugin {
  private context : Hades | null = null;
  private options : LenisRenderOptions;
  private nativeScrollHandler : EventListenerOrEventListenerObject;
  private isValidEvent : boolean = false;
  private interval : number | null = null;

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

  public wheel(context : Hades, event : HermesEvent) : boolean {
    // If the node of the event is not the direct child of scrollNode and is a scrollable node
    // need to prevent the lenis scroll to trigger
    if (
      (event.originalEvent.target as HTMLElement).parentNode !== this.options.scrollNode &&
      isScrollableElement((event.originalEvent.target as HTMLElement))
    ) return true;

    if (event.type === 'wheel') {
      event.originalEvent.preventDefault();
      this.isValidEvent = true;
    } else {
      this.isValidEvent = false;
    }

    return false;
  }

  public render(context : Hades) : void {
    if (this.options.renderScroll && this.isValidEvent) {
      this.options.scrollNode.scrollTo(context.amount.x, context.amount.y);
    }
  }

  public scroll(context : Hades, event : HermesEvent) : void {
    // Clamp the external temp  to be inside the boundaries if not infinite scrolling
    const isWindow = this.options.scrollNode === window;
    const node = (isWindow ? document.body : this.options.scrollNode as HTMLElement);
    const bound = {
      x: node.scrollWidth - (isWindow ? window.innerWidth : node.clientWidth),
      y: node.scrollHeight - (isWindow ? window.innerHeight : node.clientHeight),
    };

    context.internalTemp = {
      x: Math.min(Math.max(context.internalTemp.x, 0), bound.x),
      y: Math.min(Math.max(context.internalTemp.y,0), bound.y),
    }
  }

  private nativeScroll(event : Event) : void {
    if (this.context && !this.isValidEvent) {
      const propX = this.options.scrollNode === window ? 'scrollX' : 'scrollLeft';
      const propY = this.options.scrollNode === window ? 'scrollY' : 'scrollTop';
      this.context.scrollTo({
        x: (this.options.scrollNode as any)[propX],
        y: (this.options.scrollNode as any)[propY],
      }, 0, true);
    }

    // Temporary (?) fix for native scrollbar click
    if (window) {
      if (this.interval) window.clearInterval(this.interval);
      this.interval = window.setTimeout(() => { this.isValidEvent = false }, 100);
    }
  }

  public scrollTo(context : Hades) {
    this.isValidEvent = true; // Force the scroll render on mobile
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

  public swapScrollNode(node : HTMLElement | Window) {
    node.addEventListener('scroll', this.nativeScrollHandler);
    this.options.scrollNode.removeEventListener('scroll', this.nativeScrollHandler);
    this.options.scrollNode = node;
  }

  public get boundaries() : Boundaries {
    if (this.options.scrollNode instanceof Window) {
      return new Boundaries(
        0, document.body.scrollWidth - document.body.clientWidth,
        0, document.body.scrollHeight - document.body.clientHeight,
      );
    } else {
      return new Boundaries(
        0, (this.options.scrollNode as HTMLElement).scrollLeft - (this.options.scrollNode as HTMLElement).clientWidth,
        0, (this.options.scrollNode as HTMLElement).scrollHeight - (this.options.scrollNode as HTMLElement).clientHeight,
      );
    }
  }
}

export default LenisRender;
