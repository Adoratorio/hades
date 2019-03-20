import Aion from '@adoratorio/aion';
import Hermes from '@adoratorio/hermes';
import { HermesEvent } from '@adoratorio/hermes/dist/declarations';
import {
  MODE,
  DIRECTION,
  HadesOptions,
  Boundries,
  Vec2,
  Timeline,
} from "./declarations";
import Easings from "./easing";

class Hades {
  static EASING = Easings;
  static MODE = MODE;
  static DIRECTION = DIRECTION;

  private options : HadesOptions;
  private engine : Aion;
  private manager : Hermes;
  private internalAmount : Vec2 = { x: 0, y: 0 };
  private scrollHandler : Function;
  private frameHandler : Function;
  private timeline : Timeline;
  private prevDirection : Vec2 = { x: Hades.DIRECTION.INITIAL, y: Hades.DIRECTION.INITIAL };
  private prevAmount : Vec2 = { x: 0, y: 0 };

  public amount : Vec2 = { x: 0, y: 0 };
  public speed : Vec2 = { x: 0, y: 0 };

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
      boundries: Hades.createBoundries(0, 0, 0, 0),
      mode: MODE.AUTO,
      sections: false,
      autoplay: true,
      aion: null,
      touchMultiplier: 2,
      smoothDirectionChange: false,
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

    // Set base css for performance boost
    this.options.container.style.webkitBackfaceVisibility = 'hidden';
    this.options.container.style.backfaceVisibility = 'hidden';

    // Atach and listen to events
    this.manager = new Hermes({
      container: window,
      touchMultiplier: this.options.touchMultiplier,
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
    const current : Vec2 = {
      x: this.timeline.current.x,
      y: this.timeline.current.y,
    };
    const roundedCurrent : Vec2 = {
      x: Math.round(this.timeline.current.x),
      y: Math.round(this.timeline.current.y),
    }
    this.amount = this.options.renderByPixel ? roundedCurrent : current;

    // Apply transformation
    const px = this.options.lockX ? 0 : this.amount.x * -1;
    const py = this.options.lockY ? 0 : this.amount.y * -1;
    const prop = `translateX(${px}px) translateY(${py}px) translateZ(0)`;
    this.options.container.style.transform = prop;

    // Calculate the speed
    this.speed = {
      x: Math.abs((current.x - this.prevAmount.x) / delta),
      y: Math.abs((current.y - this.prevAmount.y) / delta),
    }
    this.prevAmount = current;

    // Reset the initial position of the timeline for the next frame
    this.timeline.initial = this.timeline.current;
  }

  private scroll(event : HermesEvent) : void {
    // Set the first scroll direction
    if (this.prevDirection.x === Hades.DIRECTION.INITIAL || this.prevDirection.y === Hades.DIRECTION.INITIAL) {
      this.prevDirection.x = event.delta.x > 0 ? Hades.DIRECTION.DOWN : Hades.DIRECTION.UP;
      this.prevDirection.y = event.delta.y > 0 ? Hades.DIRECTION.DOWN : Hades.DIRECTION.UP;
    }

    // Temporary sum amount
    const tempX = this.internalAmount.x + event.delta.x;
    const tempY = this.internalAmount.y + event.delta.y;

    // Clamp the sum amount to be inside the boundries
    this.internalAmount.x = Math.min(Math.max(tempX, this.options.boundries.min.x), this.options.boundries.max.y);
    this.internalAmount.y = Math.min(Math.max(tempY, this.options.boundries.min.y), this.options.boundries.max.y);

    // Check the scroll direction
    const currentXDirection = event.delta.x > 0 ? Hades.DIRECTION.DOWN : Hades.DIRECTION.UP;
    const currentYDirection = event.delta.y > 0 ? Hades.DIRECTION.DOWN : Hades.DIRECTION.UP;
    if (!this.options.smoothDirectionChange) {
      if (currentXDirection !== this.prevDirection.x) this.internalAmount.x = this.amount.x;
      if (currentYDirection !== this.prevDirection.y) this.internalAmount.y = this.amount.y;
    }
    this.prevDirection.x = currentXDirection;
    this.prevDirection.y = currentYDirection;
    
    // Emit the event and call the callback
    if (this.options.emitGlobal) {
      const eventInit : CustomEventInit = {};
      eventInit.detail = event;
      const customEvent : CustomEvent = new CustomEvent('hades-scroll', eventInit);
      window.dispatchEvent(customEvent);
    }
    this.options.callback(event);
  }

  private get virtual() {
    return this.options.mode === Hades.MODE.VIRTUAL;
  }

  private get fake() {
    return this.options.mode === Hades.MODE.FAKE;
  }

  private get native() {
    return this.options.mode === Hades.MODE.NATIVE;
  }

  public static createBoundries(xMin : number, xMax : number, yMin : number, yMax : number) : Boundries {
    const boundries : Boundries = {
      min: { x: xMin, y: yMin },
      max: { x: xMax, y: yMax }
    };
    return boundries;
  }

  public get direction() {
    return this.prevDirection;
  }
}

export default Hades;