import AionClass from '@adoratorio/aion';
import HermesClass from '@adoratorio/hermes';
import {
  DIRECTION,
  type Aion,
  type Easing,
  type HadesOptions,
  type HadesPlugin,
  type HermesEvent,
  type Timeline,
  type Vec2,
} from './types.ts';
import Easings from './easing.ts';

export { default as Boundaries } from './Boundaries.ts';
export { DIRECTION } from './types.ts';
export type {
  Aion,
  Easing,
  HadesOptions,
  HadesPlugin,
  HermesEvent,
  Timeline,
  Vec2,
} from './types.ts';
export { default as EASING, type EasingFunction } from './easing.ts';

// `@adoratorio/aion` and `@adoratorio/hermes` ship legacy CJS-style typings:
// remap the default imports to the class constructor types (at runtime
// bundlers resolve the real ESM default exports, which ARE the classes).
const AionEngine = AionClass as unknown as (typeof AionClass)['default'];
const HermesManager = HermesClass as unknown as (typeof HermesClass)['default'];

type Hermes = InstanceType<(typeof HermesClass)['default']>;

// Module-scoped so each Hades instance gets a unique aion frame id even when
// several are constructed in the same millisecond on a shared aion engine.
let frameIdCounter = 0;

class Hades {
  static readonly EASING: typeof Easings = Easings;
  static readonly DIRECTION: typeof DIRECTION = DIRECTION;

  #amount: Vec2 = { x: 0, y: 0 };
  #temp: Vec2 = { x: 0, y: 0 };

  #options: HadesOptions;
  #engine: Aion;
  #manager: Hermes;
  #scrollHandler: (event: HermesEvent) => void;
  #frameHandler: (delta: number, frameId: number) => void;
  #timeline: Timeline;
  #prevDirection: Vec2 = { x: Hades.DIRECTION.INITIAL, y: Hades.DIRECTION.INITIAL };
  #prevAmount: Vec2 = { x: 0, y: 0 };
  #automaticScrolling = false;
  #imediateScrolling = false;
  #aionId = `hades-frame-${frameIdCounter++}`;
  #plugins: HadesPlugin[] = [];
  #internalId = 0;

  public amount: Vec2 = { x: 0, y: 0 };
  public velocity: Vec2 = { x: 0, y: 0 };
  public running = false;

  constructor(options: Partial<HadesOptions>) {
    const defaults: HadesOptions = {
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
    this.#options = { ...defaults, ...options };

    this.#timeline = {
      start: 0,
      duration: this.#options.easing.duration,
      initial: { x: 0, y: 0 },
      final: { x: 0, y: 0 },
      current: { x: 0, y: 0 },
    };
    this.#scrollHandler = (event: HermesEvent): void => this.#scroll(event);
    this.#frameHandler = (delta: number): void => this.#frame(delta);

    // Atach and listen to events
    this.#manager = new HermesManager({
      mode: HermesManager.MODE.VIRTUAL,
      root: this.#options.root,
      touchMultiplier: this.#options.touchMultiplier,
      passive: false,
    });

    // Check and initialize Aion
    if (this.#options.autoplay) {
      this.play();
    }
    if (this.#options.aion === null || typeof this.#options.aion === 'undefined') {
      this.#engine = new AionEngine({});
    } else {
      this.#engine = this.#options.aion;
    }

    this.#engine.add(this.#frameHandler, this.#aionId);
    this.#engine.start();
  }

  #frame(delta: number): void {
    // Call PLUGIN preFrame
    this.#plugins.forEach((plugin) => plugin.preFrame && plugin.preFrame(this));

    // Get the new final value
    this.#timeline.final.x = this.#amount.x;
    this.#timeline.final.y = this.#amount.y;

    // Normalize delta based on duration
    delta = Math.min(Math.max(delta, 0), this.#options.easing.duration);

    // Normalize the delta to be 0 - 1
    let time = delta / this.#timeline.duration;

    // Check if the frame is imediate
    if (this.#imediateScrolling) {
      time = 1;
      this.#imediateScrolling = false;
    }

    // Get the interpolated time
    time = this.#options.easing.mode(time);

    // Use the interpolated time to calculate values
    this.#timeline.current.x =
      this.#timeline.initial.x + time * (this.#timeline.final.x - this.#timeline.initial.x);
    this.#timeline.current.y =
      this.#timeline.initial.y + time * (this.#timeline.final.y - this.#timeline.initial.y);
    const current: Vec2 = {
      x: this.#timeline.current.x,
      y: this.#timeline.current.y,
    };
    this.amount = current;

    // Calculate the speed (guard delta = 0 to avoid NaN/Infinity velocity)
    const dt = delta || 1;
    this.velocity = {
      x: (current.x - this.#prevAmount.x) / dt,
      y: (current.y - this.#prevAmount.y) / dt,
    };

    this.#prevAmount = this.amount;

    // Use 4 digits precision for velocity and absolutize
    this.velocity.x = parseFloat(this.velocity.x.toFixed(this.#options.precision));
    this.velocity.y = parseFloat(this.velocity.y.toFixed(this.#options.precision));

    // Check the scroll direction and reset the timeline if it's not automated by scrollTo
    const currentXDirection =
      this.velocity.x === 0
        ? Hades.DIRECTION.INITIAL
        : this.velocity.x > 0
          ? Hades.DIRECTION.DOWN
          : Hades.DIRECTION.UP;
    const currentYDirection =
      this.velocity.y === 0
        ? Hades.DIRECTION.INITIAL
        : this.velocity.y > 0
          ? Hades.DIRECTION.DOWN
          : Hades.DIRECTION.UP;
    if (!this.#options.smoothDirectionChange && !this.#automaticScrolling) {
      if (currentXDirection !== this.#prevDirection.x) {
        this.#amount.x = this.amount.x;
      }
      if (currentYDirection !== this.#prevDirection.y) {
        this.#amount.y = this.amount.y;
      }
    }
    this.#prevDirection.x = currentXDirection;
    this.#prevDirection.y = currentYDirection;

    // Reset the initial position of the timeline for the next frame
    this.#timeline.initial = this.#timeline.current;

    // Call PLUGIN render
    this.#plugins.forEach((plugin) => plugin.render && plugin.render(this));
  }

  #scroll(event: HermesEvent): void {
    // Call PLUGIN wheel, can return true to prevent proceeding
    let prevent = false;
    this.#plugins.forEach((plugin) => {
      if (plugin.wheel) {
        prevent = plugin.wheel(this, event);
      }
    });
    if (prevent) {
      return;
    }

    // Return if is stopped
    if (!this.running) {
      return;
    }
    if (Math.abs(event.delta.x) < this.#options.threshold.x) {
      event.delta.x = 0;
    }
    if (Math.abs(event.delta.y) < this.#options.threshold.y) {
      event.delta.y = 0;
    }

    // Reset from the scrollTo if needed
    if (this.#automaticScrolling) {
      this.#timeline.duration = this.#options.easing.duration;
      this.amount = this.#prevAmount;
      this.#automaticScrolling = false;
    }

    // Call PLUGIN preScroll
    this.#plugins.forEach((plugin) => plugin.preScroll && plugin.preScroll(this, event));

    // Multiply the scroll by the options multiplier
    event.delta.x *= this.#options.globalMultiplier;
    event.delta.y *= this.#options.globalMultiplier;

    // Temporary sum amount
    this.#temp.x = this.#amount.x + (!this.#options.invert ? event.delta.x : event.delta.y);
    this.#temp.y = this.#amount.y + (!this.#options.invert ? event.delta.y : event.delta.x);

    // Call PLUGIN scroll
    this.#plugins.forEach((plugin) => plugin.scroll && plugin.scroll(this, event));

    // Finalize the amount, need if the plugin modify the temp amount inside scroll callback
    this.#amount.x = this.#temp.x;
    this.#amount.y = this.#temp.y;
  }

  public scrollTo(position: Partial<Vec2>, duration: number, prevent = false): void {
    if (duration > 0) {
      this.#automaticScrolling = true;
      this.#timeline.duration = duration;
    } else {
      this.#imediateScrolling = true;
    }

    // Reset the timeline at the current position before overwriting the scroll
    if (!this.#options.smoothDirectionChange) {
      this.#amount.x = this.amount.x;
      this.#amount.y = this.amount.y;
    }

    if (typeof position.x !== 'undefined') {
      this.#amount.x = position.x;
    }
    if (typeof position.y !== 'undefined') {
      this.#amount.y = position.y;
    }

    // Call PLUGIN scrollTo
    if (!prevent) {
      this.#plugins.forEach(
        (plugin) => plugin.scrollTo && plugin.scrollTo(this, position, duration),
      );
    }
  }

  public registerPlugin(plugin: HadesPlugin, id?: string): string {
    let i: string;
    if (typeof id === 'undefined') {
      i = `hades-plugin-${this.#internalId}`;
      this.#internalId += 1;
    } else {
      i = id;
    }
    this.#register(plugin, i);
    return i;
  }

  public unregisterPlugin(id: string): boolean {
    const foundIndex = this.#plugins.findIndex((p) => p.id === id);
    if (foundIndex === -1) {
      return false;
    }
    const found = this.#plugins[foundIndex];
    if (found && typeof found.destroy === 'function') {
      found.destroy();
    }
    this.#plugins.splice(foundIndex, 1);
    return true;
  }

  public registerPlugins(plugins: HadesPlugin[], ids: string[]): string[] {
    const is: string[] = [];
    plugins.forEach((plugin, index) => {
      is.push(this.registerPlugin(plugin, ids[index]));
    });

    return is;
  }

  public getPlugin(name: string): HadesPlugin | undefined {
    return this.#plugins.find((plugin) => plugin.name === name);
  }

  public getRenderer(): HadesPlugin | undefined {
    // Try to retrive the first valid render plugin
    const valid = new Set(['VirtualRender', 'LenisRender', 'NativeRender']);
    return this.#plugins.find((plugin) => valid.has(plugin.name));
  }

  public play(): void {
    this.running = true;
    this.#manager.on(this.#scrollHandler);
    // Call PLUGIN play hook
    this.#plugins.forEach((plugin) => plugin.play && plugin.play(this));
  }

  public pause(): void {
    this.running = false;
    this.#manager.off();
    // Call PLUGIN play hook
    this.#plugins.forEach((plugin) => plugin.pause && plugin.pause(this));
  }

  public destroy(): void {
    this.#plugins.forEach((plugin) => plugin.destroy && plugin.destroy());
    this.#manager.destroy();
    this.#engine.remove(this.#aionId);
  }

  // Common getter for retriving props

  public get direction(): Vec2 {
    return this.#prevDirection;
  }

  public get root(): HTMLElement | Window {
    return this.#options.root;
  }

  public get internalAmount(): Vec2 {
    return this.#amount;
  }

  public get internalTemp(): Vec2 {
    return this.#temp;
  }

  public get still(): boolean {
    return this.direction.y === DIRECTION.INITIAL && this.direction.x === DIRECTION.INITIAL;
  }

  public get easing(): Easing {
    return this.#options.easing;
  }

  // Common setters for setting option on the fly

  public set easing(easing: Easing) {
    this.#options.easing = easing;
  }

  public set touchMultiplier(touchMultiplier: number) {
    this.#options.touchMultiplier = touchMultiplier;
  }

  public set smoothDirectionChange(smoothDirectionChange: boolean) {
    this.#options.smoothDirectionChange = smoothDirectionChange;
  }

  public set invert(invert: boolean) {
    this.#options.invert = invert;
  }

  public set internalAmount(values: Vec2) {
    this.#amount.x = values.x;
    this.#amount.y = values.y;
  }

  public set internalTemp(values: Vec2) {
    this.#temp.x = values.x;
    this.#temp.y = values.y;
  }

  #register(plugin: HadesPlugin, id: string): void {
    if (typeof plugin.register === 'function') {
      plugin.register(this);
    }
    plugin.id = id;
    this.#plugins.push(plugin);
  }
}

export default Hades;
