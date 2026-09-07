import AionEngine from '@adoratorio/aion';
import HermesManager, { MODE } from '@adoratorio/hermes';
import {
  DIRECTION,
  type Aion,
  type Easing,
  type HadesOptions,
  type HadesInputOptions,
  type HadesPlugin,
  type HermesEvent,
  type Timeline,
  type Vec2,
} from './types.ts';
import { EASINGS } from './easing.ts';

type Hermes = InstanceType<typeof HermesManager>;

// Below this distance (px) the smoothing snaps onto the target, so the scroll
// settles instead of approaching the target forever
const SETTLE_EPSILON = 0.01;
const RENDERER_NAMES: ReadonlySet<string> = new Set([
  'VirtualRender',
  'LenisRender',
  'NativeRender',
]);

let frameIdCounter = 0;

class Hades {
  static readonly EASING: typeof EASINGS = EASINGS;
  static readonly DIRECTION: typeof DIRECTION = DIRECTION;

  #amount: Vec2 = { x: 0, y: 0 };
  #temp: Vec2 = { x: 0, y: 0 };
  #options: HadesOptions;
  #motionQuery: MediaQueryList | null = null;
  #engine: Aion;
  #manager: Hermes;
  #timeline: Timeline;
  #prevDirection: Vec2 = { x: Hades.DIRECTION.INITIAL, y: Hades.DIRECTION.INITIAL };
  #prevAmount: Vec2 = { x: 0, y: 0 };
  #automaticScrolling = false;
  #immediateScrolling = false;
  #aionId = `hades-frame-${frameIdCounter++}`;
  #plugins: HadesPlugin[] = [];
  #internalId = 0;

  public amount: Vec2 = { x: 0, y: 0 };
  public velocity: Vec2 = { x: 0, y: 0 };
  public running = false;

  constructor(options: HadesInputOptions = {}) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('[Hades] You are not using this package in a browser environment');
    }

    const defaults: HadesOptions = {
      root: document.body,
      easing: {
        mode: EASINGS.LINEAR,
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
      debug: false,
    };

    // Nested objects are merged too, so a partial `easing` keeps the other defaults
    this.#options = {
      ...defaults,
      ...options,
      easing: { ...defaults.easing, ...options.easing },
      threshold: { ...defaults.threshold, ...options.threshold },
    };

    if (!Number.isFinite(this.#options.easing.duration) || this.#options.easing.duration < 0) {
      throw new RangeError('[Hades] Easing duration must be finite and non-negative');
    }

    if (this.#options.respectReducedMotion && typeof window.matchMedia === 'function') {
      this.#motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    }

    this.#timeline = {
      duration: this.#options.easing.duration,
      initial: { x: 0, y: 0 },
      final: { x: 0, y: 0 },
      current: { x: 0, y: 0 },
    };

    this.#manager = new HermesManager({
      mode: MODE.VIRTUAL,
      root: this.#options.root,
      touchMultiplier: this.#options.touchMultiplier,
      passive: false,
      debug: this.#options.debug,
    });

    this.#engine = this.#options.aion ?? new AionEngine({ debug: this.#options.debug });
    this.#engine.add(this.#frame, this.#aionId);
    this.#engine.start();

    if (this.#options.autoplay) {
      this.play();
    }
  }

  #debugWarn(message: string): void {
    if (this.#options.debug) {
      console.warn(`[Hades] ${message}`);
    }
  }

  #frame = (delta: number): void => {
    this.#plugins.forEach((plugin) => plugin.preFrame?.(this));

    this.#advance(delta);
    this.#updateVelocity(delta || 1);
    this.#updateDirection();

    const { initial, final, current } = this.#timeline;
    initial.x = current.x;
    initial.y = current.y;

    // A programmatic scroll is over once the target is reached
    if (this.#automaticScrolling && current.x === final.x && current.y === final.y) {
      this.#automaticScrolling = false;
      this.#timeline.duration = this.#options.easing.duration;
    }

    this.#plugins.forEach((plugin) => plugin.render?.(this));
  };

  // Move `current` towards the target by the eased fraction of this frame
  #advance(delta: number): void {
    const { initial, final, current } = this.#timeline;
    final.x = this.#amount.x;
    final.y = this.#amount.y;

    // Clamp the frame delta to the active duration so `time` never exceeds 1
    const clamped = Math.min(Math.max(delta, 0), this.#timeline.duration);
    let time = this.#timeline.duration === 0 ? 1 : clamped / this.#timeline.duration;

    if (this.#immediateScrolling || this.#motionQuery?.matches) {
      time = 1;
      this.#immediateScrolling = false;
    }

    time = this.#options.easing.mode(time);

    current.x = initial.x + time * (final.x - initial.x);
    current.y = initial.y + time * (final.y - initial.y);

    // Settle onto the target once close enough
    if (Math.abs(final.x - current.x) < SETTLE_EPSILON) {
      current.x = final.x;
    }
    if (Math.abs(final.y - current.y) < SETTLE_EPSILON) {
      current.y = final.y;
    }

    // `amount` is a fresh object every frame: `#prevAmount` keeps the previous
    // one, which is what the velocity is computed against
    this.amount = { x: current.x, y: current.y };
  }

  // `dt` is the frame delta; a 0 delta is treated as 1 to avoid NaN/Infinity
  #updateVelocity(dt: number): void {
    const precisionFactor = 10 ** this.#options.precision;
    this.velocity = {
      x:
        Math.round(((this.amount.x - this.#prevAmount.x) / dt) * precisionFactor) / precisionFactor,
      y:
        Math.round(((this.amount.y - this.#prevAmount.y) / dt) * precisionFactor) / precisionFactor,
    };
    this.#prevAmount = this.amount;
  }

  // On an abrupt direction change the pending momentum is dropped by moving the
  // target onto the rendered position. Starting from still is not a change.
  #updateDirection(): void {
    const currentXDirection = this.#resolveDirection(this.velocity.x);
    const currentYDirection = this.#resolveDirection(this.velocity.y);

    if (!this.#options.smoothDirectionChange && !this.#automaticScrolling) {
      if (this.#isReversal(currentXDirection, this.#prevDirection.x)) {
        this.#amount.x = this.amount.x;
      }
      if (this.#isReversal(currentYDirection, this.#prevDirection.y)) {
        this.#amount.y = this.amount.y;
      }
    }
    this.#prevDirection.x = currentXDirection;
    this.#prevDirection.y = currentYDirection;
  }

  #resolveDirection(velocity: number): DIRECTION {
    if (velocity === 0) {
      return Hades.DIRECTION.INITIAL;
    }
    return velocity > 0 ? Hades.DIRECTION.DOWN : Hades.DIRECTION.UP;
  }

  #isReversal(current: number, previous: number): boolean {
    return (
      current !== Hades.DIRECTION.INITIAL &&
      previous !== Hades.DIRECTION.INITIAL &&
      current !== previous
    );
  }

  #scroll = (event: HermesEvent): void => {
    // Work on a copy: the Hermes event (and its global listeners) stay untouched
    const scrollEvent: HermesEvent = {
      ...event,
      delta: { x: event.delta.x, y: event.delta.y },
    };

    let prevent = false;
    this.#plugins.forEach((plugin) => {
      if (plugin.wheel?.(this, scrollEvent)) {
        prevent = true;
      }
    });

    if (prevent || !this.running) {
      return;
    }

    const { delta } = scrollEvent;
    if (Math.abs(delta.x) < this.#options.threshold.x) {
      delta.x = 0;
    }
    if (Math.abs(delta.y) < this.#options.threshold.y) {
      delta.y = 0;
    }

    // User input interrupts a programmatic scroll: continue from the rendered
    // position, not from the (possibly far away) scrollTo target
    if (this.#automaticScrolling) {
      this.#timeline.duration = this.#options.easing.duration;
      this.#amount.x = this.amount.x;
      this.#amount.y = this.amount.y;
      this.#automaticScrolling = false;
    }

    this.#plugins.forEach((plugin) => plugin.preScroll?.(this, scrollEvent));

    delta.x *= this.#options.globalMultiplier;
    delta.y *= this.#options.globalMultiplier;

    this.#temp.x = this.#amount.x + (this.#options.invert ? delta.y : delta.x);
    this.#temp.y = this.#amount.y + (this.#options.invert ? delta.x : delta.y);

    // Plugins may clamp or alter `internalTemp` here
    this.#plugins.forEach((plugin) => plugin.scroll?.(this, scrollEvent));

    this.#amount.x = this.#temp.x;
    this.#amount.y = this.#temp.y;
  };

  public scrollTo(position: Partial<Vec2>, duration: number, prevent = false): void {
    if (
      !Number.isFinite(duration) ||
      ![position.x, position.y].every((value) => value === undefined || Number.isFinite(value))
    ) {
      throw new RangeError('[Hades] Scroll position and duration must be finite');
    }
    this.#immediateScrolling = duration <= 0;
    this.#automaticScrolling = duration > 0;
    if (duration > 0) {
      this.#automaticScrolling = true;
      this.#timeline.duration = duration;
    } else {
      this.#immediateScrolling = true;
      this.#timeline.duration = this.#options.easing.duration;
    }

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

    if (!prevent) {
      this.#plugins.forEach((plugin) => plugin.scrollTo?.(this, position, duration));
    }
  }

  public registerPlugin(plugin: HadesPlugin, id?: string): string {
    if (!plugin.name) {
      throw new Error('[Hades] Plugin must have a name property');
    }
    if (this.#plugins.some((p) => p.name === plugin.name)) {
      throw new Error(`[Hades] Plugin with name "${plugin.name}" is already registered`);
    }

    const pluginId = id ?? `hades-plugin-${this.#internalId++}`;
    this.#register(plugin, pluginId);
    return pluginId;
  }

  public registerPlugins(plugins: HadesPlugin[], ids: string[] = []): string[] {
    return plugins.map((plugin, index) => this.registerPlugin(plugin, ids[index]));
  }

  public unregisterPlugin(id: string): boolean {
    const foundIndex = this.#plugins.findIndex((p) => p.id === id);
    if (foundIndex === -1) {
      this.#debugWarn(`No plugin registered with id "${id}"`);
      return false;
    }
    const found = this.#plugins[foundIndex];
    if (found && typeof found.destroy === 'function') {
      found.destroy();
    }
    this.#plugins.splice(foundIndex, 1);
    return true;
  }

  public getPlugin<T extends HadesPlugin = HadesPlugin>(name: string): T | undefined {
    return this.#plugins.find((plugin) => plugin.name === name) as T | undefined;
  }

  public getRenderer(): HadesPlugin | undefined {
    return this.#plugins.find((plugin) => RENDERER_NAMES.has(plugin.name));
  }

  public play(): void {
    this.running = true;
    this.#manager.on(this.#scroll);
    this.#plugins.forEach((plugin) => plugin.play?.(this));
  }

  public pause(): void {
    this.running = false;
    this.#manager.off();
    this.#plugins.forEach((plugin) => plugin.pause?.(this));
  }

  public destroy(): void {
    this.running = false;
    this.#plugins.forEach((plugin) => plugin.destroy?.());
    this.#plugins = [];
    this.#manager.destroy();
    this.#engine.remove(this.#aionId);
  }

  public get direction(): Vec2 {
    return this.#prevDirection;
  }
  public get root(): HTMLElement | Window {
    return this.#options.root;
  }
  public get internalAmount(): Vec2 {
    return this.#amount;
  }
  public set internalAmount(values: Vec2) {
    this.#amount.x = values.x;
    this.#amount.y = values.y;
  }
  public get internalTemp(): Vec2 {
    return this.#temp;
  }
  public set internalTemp(values: Vec2) {
    this.#temp.x = values.x;
    this.#temp.y = values.y;
  }
  public get still(): boolean {
    return this.direction.y === DIRECTION.INITIAL && this.direction.x === DIRECTION.INITIAL;
  }
  public get easing(): Easing {
    return this.#options.easing;
  }
  public set easing(easing: Partial<Easing>) {
    if (
      easing.duration !== undefined &&
      (!Number.isFinite(easing.duration) || easing.duration < 0)
    ) {
      throw new RangeError('[Hades] Easing duration must be finite and non-negative');
    }
    this.#options.easing = { ...this.#options.easing, ...easing };
    if (!this.#automaticScrolling) {
      this.#timeline.duration = this.#options.easing.duration;
    }
  }
  public get touchMultiplier(): number {
    return this.#options.touchMultiplier;
  }
  public set touchMultiplier(touchMultiplier: number) {
    this.#options.touchMultiplier = touchMultiplier;
    this.#manager.touchMultiplier = touchMultiplier;
  }
  public get smoothDirectionChange(): boolean {
    return this.#options.smoothDirectionChange;
  }
  public set smoothDirectionChange(smoothDirectionChange: boolean) {
    this.#options.smoothDirectionChange = smoothDirectionChange;
  }
  public get invert(): boolean {
    return this.#options.invert;
  }
  public set invert(invert: boolean) {
    this.#options.invert = invert;
  }

  #register(plugin: HadesPlugin, id: string): void {
    if (typeof plugin.register === 'function') {
      plugin.register(this);
    }
    plugin.id = id;
    this.#plugins.push(plugin);
  }
}

export {
  type HadesInputOptions,
  type Aion,
  type BoundedRenderer,
  type Bounds,
  type Easing,
  type HadesOptions,
  type HadesPlugin,
  type HermesEvent,
  type Timeline,
  type Vec2,
} from './types.ts';

export { default as Boundaries } from './Boundaries.ts';
export { DIRECTION } from './types.ts';
export { EASINGS as EASING, type EasingFunction } from './easing.ts';
export default Hades;
