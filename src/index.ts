import Aion from '@adoratorio/aion';
import Hermes from '@adoratorio/hermes';
import { HermesEvent } from '@adoratorio/hermes/dist/declarations';
import {
  MODE,
  HadesOptions,
  Boundries,
  Vec2,
  Timeline,
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
  private scrollHandler : Function;
  private frameHandler : Function;
  private timeline : Timeline;

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
    this.timeline = {
      start: 0,
      duration: this.options.duration,
      initial: 0,
      final: 0,
      current: 0,
    };
    this.scrollHandler = (event : HermesEvent) => this.scroll(event);
    this.frameHandler = (time : number) => this.frame(time);

    if (this.options.container === null || typeof this.options.viewport === 'undefined') {
      throw new Error('Viewport cannot be undefined');
    }
    if (this.options.container === null || typeof this.options.container === 'undefined') {
      throw new Error('Container cannot be undefined');
    }

    // Initialize apropriate dimensions
    this.viewportRect = this.options.viewport.getBoundingClientRect() as DOMRect
    this.containerRect = this.options.container.getBoundingClientRect() as DOMRect;
    this.boundries = {
      top: this.containerRect.top,
      bottom: this.containerRect.height - this.viewportRect.height,
    }

    // Atach and listen to events
    this.manager = new Hermes({
      container: window,
    });
    this.manager.on(this.scrollHandler);

    // Check and initialize Aion
    if (this.options.aion === null || typeof this.options.aion === 'undefined') {
      this.engine = new Aion();
    } else {
      this.engine = this.options.aion;
    }
    this.engine.add(this.frameHandler, 'hades_frame');
    if (this.options.autoplay) this.engine.start();
  }

  private frame(time : number) : void {
    // Calculate the delta based on the last triggered event
    const deltaT = performance.now() - this.timeline.start;
    const clampDeltaT = Math.min(Math.max(deltaT, 0), this.options.duration);
    // Normalize the delta to be 0 - 1
    let t = clampDeltaT / this.timeline.duration;
    // Get the interpolated time
    t = this.options.easing(t);
    // Use the interpolated time to calculate values
    this.timeline.current = this.timeline.initial + (t * (this.timeline.final - this.timeline.initial));
    this.amount.y = this.timeline.current;
    const px = this.options.lockX ? 0 : this.amount.x * -1;
    const py = this.options.lockY ? 0 : this.amount.y * -1;
    const prop = `translateX(${px}px) translateY(${py}px)`;
    this.options.container.style.transform = prop;
  }

  private scroll(event : HermesEvent) : void {
    this.internalAmount.x += event.delta.x;
    this.internalAmount.y += event.delta.y;
    this.timeline.start = performance.now();
    this.timeline.initial = this.timeline.current;
    this.timeline.final = this.internalAmount.y;
  }

  private get virtual() {
    return this.options.mode === Hades.MODE.VIRTUAL;
  }
}

export default Hades;