import Aion from '@adoratorio/aion';
import Hermes from '@adoratorio/hermes';
import { HermesEvent } from '@adoratorio/hermes/dist/declarations';
import Boundaries from './Boundaries';
import {
  DIRECTION,
  HadesOptions,
  Vec2,
  Timeline,
  Easing,
  HadesPlugin,
} from "./declarations";
import Easings from "./easing";

class Hades {
  static EASING = Easings;
  static DIRECTION = DIRECTION;

  private _amount : Vec2 = { x: 0, y: 0 };

  private options : HadesOptions;
  private engine : Aion;
  private manager : Hermes;
  private scrollHandler : Function;
  private frameHandler : Function;
  private timeline : Timeline;
  private prevDirection : Vec2 = { x: Hades.DIRECTION.INITIAL, y: Hades.DIRECTION.INITIAL };
  private prevAmount : Vec2 = { x: 0, y: 0 };
  private automaticScrolling : boolean = false;
  private imediateScrolling : boolean = false;
  private aionId : string = `hades-frame-${Date.now()}`;
  private plugins : Array<HadesPlugin> = [];

  public amount : Vec2 = { x: 0, y: 0 };
  public velocity : Vec2 = { x: 0, y: 0 };
  public running : boolean = false;

  constructor(options : Partial<HadesOptions>) {
    const defaults : HadesOptions = {
      root: document.body,
      easing: {
        mode: Easings.LINEAR,
        duration: 1000,
      },
      infiniteScroll: false,
      lockX: true,
      lockY: false,
      boundaries: new Boundaries(0, 0, 0, 0),
      autoBoundaries: true,
      autoplay: true,
      aion: null,
      touchMultiplier: 1.5,
      smoothDirectionChange: false,
      scale: 1,
      threshold: {
        x: 0,
        y: 3,
      },
      precision: 4,
    };
    this.options = { ...defaults, ...options };

    this.timeline = {
      start: 0,
      duration: this.options.easing.duration,
      initial: { x: 0, y: 0 },
      final: { x: 0, y: 0 },
      current: { x: 0, y: 0 },
    };
    this.scrollHandler = (event : HermesEvent) => this.scroll(event);
    this.frameHandler = (delta : number) => this.frame(delta);

    // Atach and listen to events
    this.manager = new Hermes({
      mode: Hermes.MODE.VIRTUAL,
      container: this.options.root,
      touchMultiplier: this.options.touchMultiplier,
    });
    this.manager.on(this.scrollHandler);

    // Check and initialize Aion
    if (this.options.autoplay) this.running = true;
    if (this.options.aion === null || typeof this.options.aion === 'undefined') {
      this.engine = new Aion();
    } else {
      this.engine = this.options.aion;
    }

    this.engine.add(this.frameHandler, this.aionId);
    this.engine.start();
  }

  private frame(delta : number) : void {
    // Call PLUGIN preFrame
    this.plugins.forEach((plugin) => plugin.preFrame && plugin.preFrame(this));

     // If boundires are autosetted use the container dimensions
     if (this.options.autoBoundaries) {
      const containerRect = this.options.root.getBoundingClientRect();
      this.options.boundaries = new Boundaries(
        0,
        containerRect.width - window.innerWidth,
        0,
        containerRect.height - window.innerHeight,
      );
    }
    
    // Get the new final value
    this.timeline.final.x = this._amount.x;
    this.timeline.final.y = this._amount.y;

    // Normalize delta based on duration
    delta = Math.min(Math.max(delta, 0), this.options.easing.duration);

    // Normalize the delta to be 0 - 1
    let time = delta / this.timeline.duration;

    // Check if the frame is imediate
    if (this.imediateScrolling) {
      time = 1;
      this.imediateScrolling = false;
    }

    // Get the interpolated time
    time = this.options.easing.mode(time);

    // Use the interpolated time to calculate values
    this.timeline.current.x = this.timeline.initial.x + (time * (this.timeline.final.x - this.timeline.initial.x));
    this.timeline.current.y = this.timeline.initial.y + (time * (this.timeline.final.y - this.timeline.initial.y));
    const current : Vec2 = {
      x: parseFloat(this.timeline.current.x.toFixed(this.options.precision)),
      y: parseFloat(this.timeline.current.y.toFixed(this.options.precision)),
    };
    this.amount = current;

    // Calculate the speed
    this.velocity = {
      x: Math.abs((current.x - this.prevAmount.x) / delta),
      y: Math.abs((current.y - this.prevAmount.y) / delta),
    }

    // Set the velocity and round at precision
    this.velocity.x = parseFloat(this.velocity.x.toFixed(this.options.precision));
    this.velocity.y = parseFloat(this.velocity.y.toFixed(this.options.precision));
    this.prevAmount = current;

    // Check the scroll direction
    const currentXDirection = this.velocity.x > 0 ? Hades.DIRECTION.DOWN : Hades.DIRECTION.UP;
    const currentYDirection = this.velocity.y > 0 ? Hades.DIRECTION.DOWN : Hades.DIRECTION.UP;
    if (!this.options.smoothDirectionChange) {
      if (currentXDirection !== this.prevDirection.x) this._amount.x = this.amount.x;
      if (currentYDirection !== this.prevDirection.y) this._amount.y = this.amount.y;
    }
    this.prevDirection.x = currentXDirection;
    this.prevDirection.y = currentYDirection;

    // Reset the initial position of the timeline for the next frame
    this.timeline.initial = this.timeline.current;

    // Call PLUGIN render
    this.plugins.forEach((plugin) => plugin.render && plugin.render(this));
  }

  private scroll(event : HermesEvent) : void {
    // Call PLUGIN wheel
    this.plugins.forEach((plugin) => plugin.wheel && plugin.wheel(this, event));

    // Return if is stopped
    if (!this.running) return;
    if (Math.abs(event.delta.x) < this.options.threshold.x) return;
    if (Math.abs(event.delta.y) < this.options.threshold.y) return;

    // Reset from the scroll to if needed
    if (this.automaticScrolling) {
      this.timeline.duration = this.options.easing.duration;
      this.amount = this.prevAmount;
      this.automaticScrolling = false;
    }

    // Call PLUGIN preScroll
    this.plugins.forEach((plugin) => plugin.preScroll && plugin.preScroll(this, event));

    // Multiply the scroll by the options multiplier
    event.delta.y = event.delta.y * this.options.scale;

    // Set the first scroll direction
    if (this.prevDirection.x === Hades.DIRECTION.INITIAL || this.prevDirection.y === Hades.DIRECTION.INITIAL) {
      this.prevDirection.x = event.delta.x > 0 ? Hades.DIRECTION.DOWN : Hades.DIRECTION.UP;
      this.prevDirection.y = event.delta.y > 0 ? Hades.DIRECTION.DOWN : Hades.DIRECTION.UP;
    }

    // Temporary sum amount
    const tempX = this._amount.x + event.delta.x;
    const tempY = this._amount.y + event.delta.y;

    // Clamp the sum amount to be inside the boundaries if not infinite scrolling
    if (!this.options.infiniteScroll) {
      this._amount.x = Math.min(Math.max(tempX, this.options.boundaries.min.x), this.options.boundaries.max.x);
      this._amount.y = Math.min(Math.max(tempY, this.options.boundaries.min.y), this.options.boundaries.max.y);
    } else {
      this._amount.x = tempX;
      this._amount.y = tempY;
    }

    // Call PLUGIN scroll
    this.plugins.forEach((plugin) => plugin.scroll && plugin.scroll(this, event));
  }

  public scrollTo(position : Partial<Vec2>, duration : number) {
    if (duration > 0) {
      this.automaticScrolling = true;
      this.timeline.duration = duration;
    } else {
      this.imediateScrolling = true;
    }
    if (typeof position.x !== 'undefined') this._amount.x = position.x;
    if (typeof position.y !== 'undefined') this._amount.y = position.y;
  }

  public play() {
    this.running = true;
  }

  public pause() {
    this.running = false;
  }

  public destroy() {
    this.manager.destroy();
    this.engine.remove(this.aionId);

    // @ts-expect-error
    delete this.manager;
    // @ts-expect-error
    delete this.engine;
  }

  // Common getter for retriving props

  public get direction() {
    return this.prevDirection;
  }

  public get boundaries() {
    return this.options.boundaries;
  }

  // Common getters for setting option on the fly

  public set easing(easing : Easing) {
    this.options.easing = easing;
  }

  public set infiniteScroll(infiniteScroll : boolean) {
    this.options.infiniteScroll = infiniteScroll;
  }

  public set boundaries(boundaries : Boundaries) {
    this.options.boundaries = boundaries;
    if (this._amount.y > this.options.boundaries.max.y) {
      this.scrollTo({ y: this.options.boundaries.max.y }, 0);
    }
    if (this._amount.x > this.options.boundaries.max.x) {
      this.scrollTo({ x: this.options.boundaries.max.x }, 0);
    }
  }

  public set touchMultiplier(touchMultiplier : number) {
    this.options.touchMultiplier = touchMultiplier;
  }

  public set smoothDirectionChange(smoothDirectionChange : boolean) {
    this.options.smoothDirectionChange = smoothDirectionChange;
  }
}

export default Hades;
