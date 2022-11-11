import Aion from '@adoratorio/aion';
import Hermes from '@adoratorio/hermes';
import { HermesEvent } from '@adoratorio/hermes/dist/declarations';
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
  private _temp : Vec2 = { x: 0, y: 0 };

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
      autoplay: true,
      aion: null,
      touchMultiplier: 1.5,
      smoothDirectionChange: false,
      scale: 1,
      threshold: {
        x: 0,
        y: 3,
      },
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
      passive: false,
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
      x: this.timeline.current.x,
      y: this.timeline.current.y,
    };
    this.amount = current;

    // Calculate the speed
    this.velocity = {
      x: (current.x - this.prevAmount.x) / delta,
      y: (current.y - this.prevAmount.y) / delta,
    }

    this.prevAmount = this.amount;

    // Check the scroll direction and reset the timeline if it's not automated by scrollTo
    const currentXDirection = this.velocity.x === 0 ? (Hades.DIRECTION.INITIAL) : (this.velocity.x > 0 ? Hades.DIRECTION.DOWN : Hades.DIRECTION.UP);
    const currentYDirection = this.velocity.y === 0 ? (Hades.DIRECTION.INITIAL) : (this.velocity.y > 0 ? Hades.DIRECTION.DOWN : Hades.DIRECTION.UP);
    if (!this.options.smoothDirectionChange && !this.automaticScrolling) {
      if (currentXDirection !== this.prevDirection.x) this._amount.x = this.amount.x;
      if (currentYDirection !== this.prevDirection.y) this._amount.y = this.amount.y;
    }
    this.prevDirection.x = currentXDirection;
    this.prevDirection.y = currentYDirection;

    // Use 4 digits precision for velocity and absolutize
    this.velocity.x = Math.abs(parseFloat(this.velocity.x.toFixed(4)));
    this.velocity.y = Math.abs(parseFloat(this.velocity.y.toFixed(4)));

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

    // Reset from the scrollTo if needed
    if (this.automaticScrolling) {
      this.timeline.duration = this.options.easing.duration;
      this.amount = this.prevAmount;
      this.automaticScrolling = false;
    }

    // Call PLUGIN preScroll
    this.plugins.forEach((plugin) => plugin.preScroll && plugin.preScroll(this, event));

    // Multiply the scroll by the options multiplier
    event.delta.y = event.delta.y * this.options.scale;

    // Temporary sum amount
    this._temp.x = this._amount.x + event.delta.x;
    this._temp.y = this._amount.y + event.delta.y;
    
    // Call PLUGIN scroll
    this.plugins.forEach((plugin) => plugin.scroll && plugin.scroll(this, event));

    // Finalize the amount, need if the plugin modify the temp amount inside scroll callback
    this._amount.x = this._temp.x;
    this._amount.y = this._temp.y;
  }

  public scrollTo(position : Partial<Vec2>, duration : number) {
    if (duration > 0) {
      this.automaticScrolling = true;
      this.timeline.duration = duration;
    } else {
      this.imediateScrolling = true;
    }

    // Reset the timeline at the current position before overwriting the scroll
    if (!this.options.smoothDirectionChange) {
      this._amount.x = this.amount.x;
      this._amount.y = this.amount.y;
    }

    if (typeof position.x !== 'undefined') this._amount.x = position.x;
    if (typeof position.y !== 'undefined') this._amount.y = position.y;
  }

  public registerPlugin(plugin : HadesPlugin) : Array<HadesPlugin> {
    if (typeof plugin.register === 'function') plugin.register(this);
    this.plugins.push(plugin);
    return this.plugins;
  }

  public play() : void {
    this.running = true;
  }

  public pause() : void {
    this.running = false;
  }

  public destroy() : void {
    this.plugins.forEach((plugin) => plugin.destroy && plugin.destroy());
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

  public get root() {
    return this.options.root;
  }

  public get internalAmount() {
    return this._amount;
  }

  public get internalTemp() {
    return this._temp;
  }

  // Common setters for setting option on the fly

  public set easing(easing : Easing) {
    this.options.easing = easing;
  }

  public set touchMultiplier(touchMultiplier : number) {
    this.options.touchMultiplier = touchMultiplier;
  }

  public set smoothDirectionChange(smoothDirectionChange : boolean) {
    this.options.smoothDirectionChange = smoothDirectionChange;
  }

  public set internalAmount(values : Vec2) {
    this._amount.x = values.x;
    this._amount.y = values.y;
  }

  public set internalTemp(values : Vec2) {
    this._temp.x = values.x;
    this._temp.y = values.y;
  }
}

export default Hades;
