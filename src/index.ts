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
      initial: { x: 0, y: 0 },
      final: { x: 0, y: 0 },
      current: { x: 0, y: 0 },
    };
    this.scrollHandler = (event : HermesEvent) => this.scroll(event);
    this.frameHandler = (delta : number) => this.frame(delta);

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
      top: 0,
      bottom: this.containerRect.height - this.viewportRect.height,
      left: 0,
      right: 0,
    }

    // Set base css for performance boost
    this.options.container.style.webkitBackfaceVisibility = 'hidden';
    this.options.container.style.backfaceVisibility = 'hidden';

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

  private frame(delta : number) : void {
    // Get the new final value
    this.timeline.final.x = this.internalAmount.x;
    this.timeline.final.y = this.internalAmount.y;
    // Normalize delta based on duration
    delta = Math.min(Math.max(delta, 0), this.options.duration);
    // Normalize the delta to be 0 - 1
    let time = delta / this.timeline.duration;
    // Get the interpolated time
    time = this.options.easing(time);
    // Use the interpolated time to calculate values
    this.timeline.current.x = this.timeline.initial.x + (time * (this.timeline.final.x - this.timeline.initial.x));
    this.timeline.current.y = this.timeline.initial.y + (time * (this.timeline.final.y - this.timeline.initial.y));
    this.amount.x = this.options.renderByPixel ? Math.round(this.timeline.current.x) : this.timeline.current.x;
    this.amount.y = this.options.renderByPixel ? Math.round(this.timeline.current.y) : this.timeline.current.y;
    // Apply transformation
    const px = this.options.lockX ? 0 : this.amount.x * -1;
    const py = this.options.lockY ? 0 : this.amount.y * -1;
    const prop = `translateX(${px}px) translateY(${py}px) translateZ(0)`;
    this.options.container.style.transform = prop;
    // Reset the initial position of the timeline for the next frame
    this.timeline.initial = this.timeline.current;
  }

  private scroll(event : HermesEvent) : void {
    // Temporary sum amount
    const tempX = this.internalAmount.x + event.delta.x;
    const tempY = this.internalAmount.y + event.delta.y;
    // Clamp the sum amount to be inside the boundries
    this.internalAmount.x = Math.min(Math.max(tempX, this.boundries.left), this.boundries.right);
    this.internalAmount.y = Math.min(Math.max(tempY, this.boundries.top), this.boundries.bottom);
  }

  private get virtual() {
    return this.options.mode === Hades.MODE.VIRTUAL;
  }
}

export default Hades;