import Aion from '@adoratorio/aion';
import Hermes from '@adoratorio/hermes';
import { HermesEvent } from '@adoratorio/hermes/dist/declarations';
import {
  MODE,
  HadesOptions,
  Boundries,
  Vec2
} from "./declarations";
import Easings from "./easing";

class Hades {
  static EASING = Easings;
  static MODE = MODE;

  private options : HadesOptions;
  private viewportRect : DOMRect;
  private containerRect : DOMRect;
  private boundries : Boundries;
  private engine : Aion;
  private manager : Hermes;
  private internalAmount : Vec2 = { x: 0, y: 0 };

  public amount : Vec2 = { x: 0, y: 0 };

  constructor(options : Partial<HadesOptions>) {
    const defaults : HadesOptions = {
      viewport: document.querySelector('.hades-viewport') as HTMLElement,
      container: document.querySelector('.hades-container') as HTMLElement,
      easing: Easings.LINEAR,
      duration: 1000,
      infiniteScroll: false,
      emitGlobal: true,
      callback: () => {},
      renderByPixel: true,
      lockX: true,
      lockY: false,
      mode: MODE.AUTO,
      sections: false,
      autoplay: true,
      aion: null,
    };
    this.options = { ...defaults, ...options };

    // Initialize apropriate dimensions
    this.viewportRect = this.options.viewport.getBoundingClientRect() as DOMRect
    this.containerRect = this.options.container.getBoundingClientRect() as DOMRect;
    this.boundries = {
      top: this.containerRect.top,
      bottom: this.containerRect.height - this.viewportRect.height,
    }

    // Atach and listen to events
    this.manager = new Hermes({
      mode: Hermes.MODE.VIRTUAL,
    });
    this.manager.on(this.scroll);

    // Check and initialize Aion
    if (this.options.aion === null || typeof this.options.aion === 'undefined') {
      this.engine = new Aion();
    } else {
      this.engine = this.options.aion;
    }
    this.engine.add(this.frame, 'hades_frame');
    if (this.options.autoplay) this.engine.start();
  }

  private frame(time : number) : void {
    console.log(time);
  }

  private scroll(event : HermesEvent) : void {
    this.internalAmount.x += event.delta.x;
    this.internalAmount.y += event.delta.y;
    console.log(event);
  }

  private get virtual() {
    return this.options.mode === Hades.MODE.VIRTUAL;
  }
}

export default Hades;