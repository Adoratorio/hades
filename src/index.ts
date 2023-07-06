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
  private aionId : string = `hades-frame-${performance.now()}`;
  private plugins : Array<HadesPlugin> = [];
  private internalId : number = 0;

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
      globalMultiplier: 1,
      touchMultiplier: 1.5,
      smoothDirectionChange: false,
      threshold: {
        x: 0,
        y: 3,
      },
      invert: false,
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
      root: this.options.root,
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

    // Use 4 digits precision for velocity and absolutize
    this.velocity.x = parseFloat(this.velocity.x.toFixed(this.options.precision));
    this.velocity.y = parseFloat(this.velocity.y.toFixed(this.options.precision));

    // Check the scroll direction and reset the timeline if it's not automated by scrollTo
    const currentXDirection = this.velocity.x === 0 ? (Hades.DIRECTION.INITIAL) : (this.velocity.x > 0 ? Hades.DIRECTION.DOWN : Hades.DIRECTION.UP);
    const currentYDirection = this.velocity.y === 0 ? (Hades.DIRECTION.INITIAL) : (this.velocity.y > 0 ? Hades.DIRECTION.DOWN : Hades.DIRECTION.UP);
    if (!this.options.smoothDirectionChange && !this.automaticScrolling) {
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
    // Call PLUGIN wheel, can return true to prevent proceeding
    let prevent : boolean = false;
    this.plugins.forEach((plugin) => { if (plugin.wheel) prevent = plugin.wheel(this, event) });
    if (prevent) return;

    // Return if is stopped
    if (!this.running) return;
    if (Math.abs(event.delta.x) < this.options.threshold.x) event.delta.x = 0;
    if (Math.abs(event.delta.y) < this.options.threshold.y) event.delta.y = 0;

    // Reset from the scrollTo if needed
    if (this.automaticScrolling) {
      this.timeline.duration = this.options.easing.duration;
      this.amount = this.prevAmount;
      this.automaticScrolling = false;
    }

    // Call PLUGIN preScroll
    this.plugins.forEach((plugin) => plugin.preScroll && plugin.preScroll(this, event));

    // Multiply the scroll by the options multiplier
    event.delta.x = event.delta.x * this.options.globalMultiplier;
    event.delta.y = event.delta.y * this.options.globalMultiplier;

    // Temporary sum amount
    this._temp.x = this._amount.x + (!this.options.invert ? event.delta.x : event.delta.y);
    this._temp.y = this._amount.y + (!this.options.invert ? event.delta.y : event.delta.x);
    
    // Call PLUGIN scroll
    this.plugins.forEach((plugin) => plugin.scroll && plugin.scroll(this, event));

    // Finalize the amount, need if the plugin modify the temp amount inside scroll callback
    this._amount.x = this._temp.x;
    this._amount.y = this._temp.y;
  }

  public scrollTo(position : Partial<Vec2>, duration : number, prevent : boolean = false) {
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

    // Call PLUGIN scrollTo
    if (!prevent) {
      this.plugins.forEach((plugin) => plugin.scrollTo && plugin.scrollTo(this, position, duration));
    }
  }

  public registerPlugin(plugin : HadesPlugin, id? : string) : string {
    let i = null;
    if (typeof id === 'undefined') {
      i = `hades-plugin-${this.internalId}`;
      this.internalId += 1;
    } else {
      i = id;
    }
    this.register(plugin, i);
    return i;
  }

  public unregisterPlugin(id : string) : boolean {
    const foundIndex = this.plugins.findIndex((p) => p.id === id);
    const found = this.plugins[foundIndex];
    if (typeof found?.destroy === 'function') found.destroy();
    this.plugins.splice(foundIndex, 1);
    return foundIndex === -1 ? false : true;
  }

  registerPlugins(plugins : Array<HadesPlugin>, ids : Array<string>) : Array<string> {
    const is : Array<string> = [];
    plugins.forEach((plugin, index) => {
      is.push(this.registerPlugin(plugin, ids[index]));
    });

    return is;
  }

  public getPlugin(name : string) : HadesPlugin | undefined {
    return this.plugins.find(plugin => plugin.name === name);
  }

  public play() : void {
    this.running = true;
    this.manager.on(this.scrollHandler);
  }

  public pause() : void {
    this.running = false;
    this.manager.off();
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

  public get still() {
    return this.direction.y === DIRECTION.INITIAL && this.direction.x === DIRECTION.INITIAL;
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

  public set invert(invert : boolean) {
    this.options.invert = invert;
  }

  public set internalAmount(values : Vec2) {
    this._amount.x = values.x;
    this._amount.y = values.y;
  }

  public set internalTemp(values : Vec2) {
    this._temp.x = values.x;
    this._temp.y = values.y;
  }

  private register (plugin : HadesPlugin, id : string) {
    if (typeof plugin.register === 'function') plugin.register(this);
    plugin.id = id;
    this.plugins.push(plugin);
  }
}

export default Hades;
