import Hades from "../..";
import { HadesPlugin, Vec2 } from "../../declarations";
import { NativeRenderOptions } from "./declarations";

class NativeRender implements HadesPlugin {
  private _native : Vec2 = { x: 0, y: 0 };

  private context : Hades | null = null;
  private options : NativeRenderOptions;
  private nativeScrollHandler : EventListenerOrEventListenerObject;

  public name : string = 'NativeRender';

  constructor(options : Partial<NativeRenderOptions>) {
    const defaults : NativeRenderOptions = {
      scrollNode : window,
    }

    this.options = { ...defaults, ...options };
    this.nativeScrollHandler = (e : Event) => this.nativeScroll(e);

    this.options.scrollNode.addEventListener('scroll', this.nativeScrollHandler);
  }

  public register(context : Hades) : void {
    this.context = context;
  }

  public render(context : Hades) : void {
    // Use the render cycle to write hades internal amount
    context.scrollTo({
      x: this._native.x,
      y: this._native.y,
    }, 0, true); // Prevent the call for plugin scrollTo
  }

  public scrollTo(context : Hades, position : Vec2, duration : number) : void {
    this.options.scrollNode.scrollTo(position.x, position.y);
  }

  private nativeScroll(event : Event) : void {
    if (this.context) {
      const propX = this.options.scrollNode === window ? 'scrollX' : 'scrollLeft';
      const propY = this.options.scrollNode === window ? 'scrollY' : 'scrollTop';
      this._native = {
        x: (this.options.scrollNode as any)[propX],
        y: (this.options.scrollNode as any)[propY],
      };
    }
  }

  public destroy(context : Hades) : void {
    this.options.scrollNode.removeEventListener('scroll', this.nativeScrollHandler);
  }

  // Common getters for some internal props

  public get native() : Vec2 {
    return this._native;
  }
}

export default NativeRender;
