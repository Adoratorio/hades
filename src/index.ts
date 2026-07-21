import AionEngine from '@adoratorio/aion';
import HermesManager, { MODE } from '@adoratorio/hermes';
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
import { EASINGS } from './easing.ts';

type Hermes = InstanceType<typeof HermesManager>;

let frameIdCounter = 0;

class Hades {
  static readonly EASING: typeof EASINGS = EASINGS;
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

  constructor(options: Partial<HadesOptions> = {}) {
    const defaults: HadesOptions = {
      root: typeof document !== 'undefined' ? document.body : ({} as HTMLElement),
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

    this.#manager = new HermesManager({
      mode: MODE.VIRTUAL,
      root: this.#options.root,
      touchMultiplier: this.#options.touchMultiplier,
      passive: false,
    });

    if (this.#options.autoplay) {
      this.play();
    }

    this.#engine = this.#options.aion ?? new AionEngine({});

    this.#engine.add(this.#frameHandler, this.#aionId);
    this.#engine.start();
  }

  #frame(delta: number): void {
    this.#plugins.forEach((plugin) => plugin.preFrame && plugin.preFrame(this));

    this.#timeline.final.x = this.#amount.x;
    this.#timeline.final.y = this.#amount.y;

    delta = Math.min(Math.max(delta, 0), this.#options.easing.duration);
    let time = delta / this.#timeline.duration;

    if (this.#imediateScrolling) {
      time = 1;
      this.#imediateScrolling = false;
    }

    time = this.#options.easing.mode(time);

    this.#timeline.current.x =
      this.#timeline.initial.x + time * (this.#timeline.final.x - this.#timeline.initial.x);
    this.#timeline.current.y =
      this.#timeline.initial.y + time * (this.#timeline.final.y - this.#timeline.initial.y);

    const current: Vec2 = {
      x: this.#timeline.current.x,
      y: this.#timeline.current.y,
    };
    this.amount = current;

    const dt = delta || 1;
    const precisionFactor = 10 ** this.#options.precision;

    // GC optimization: round mathematically without allocating strings (toFixed/parseFloat)
    this.velocity = {
      x: Math.round(((current.x - this.#prevAmount.x) / dt) * precisionFactor) / precisionFactor,
      y: Math.round(((current.y - this.#prevAmount.y) / dt) * precisionFactor) / precisionFactor,
    };

    this.#prevAmount = this.amount;

    const currentXDirection = this.#resolveDirection(this.velocity.x);
    const currentYDirection = this.#resolveDirection(this.velocity.y);

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

    this.#timeline.initial = this.#timeline.current;

    this.#plugins.forEach((plugin) => plugin.render && plugin.render(this));
  }

  #resolveDirection(velocity: number): DIRECTION {
    if (velocity === 0) {
      return Hades.DIRECTION.INITIAL;
    }
    return velocity > 0 ? Hades.DIRECTION.DOWN : Hades.DIRECTION.UP;
  }

  #scroll(event: HermesEvent): void {
    let prevent = false;
    this.#plugins.forEach((plugin) => {
      if (plugin.wheel && plugin.wheel(this, event)) {
        prevent = true;
      }
    });

    if (prevent || !this.running) {
      return;
    }

    if (Math.abs(event.delta.x) < this.#options.threshold.x) {
      event.delta.x = 0;
    }
    if (Math.abs(event.delta.y) < this.#options.threshold.y) {
      event.delta.y = 0;
    }

    if (this.#automaticScrolling) {
      this.#timeline.duration = this.#options.easing.duration;
      this.amount = this.#prevAmount;
      this.#automaticScrolling = false;
    }

    this.#plugins.forEach((plugin) => plugin.preScroll && plugin.preScroll(this, event));

    event.delta.x *= this.#options.globalMultiplier;
    event.delta.y *= this.#options.globalMultiplier;

    this.#temp.x = this.#amount.x + (!this.#options.invert ? event.delta.x : event.delta.y);
    this.#temp.y = this.#amount.y + (!this.#options.invert ? event.delta.y : event.delta.x);

    this.#plugins.forEach((plugin) => plugin.scroll && plugin.scroll(this, event));

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
      this.#plugins.forEach(
        (plugin) => plugin.scrollTo && plugin.scrollTo(this, position, duration),
      );
    }
  }

  public registerPlugin(plugin: HadesPlugin, id?: string): string {
    const pluginId = id ?? `hades-plugin-${this.#internalId++}`;
    this.#register(plugin, pluginId);
    return pluginId;
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
    const valid = new Set(['VirtualRender', 'LenisRender', 'NativeRender']);
    return this.#plugins.find((plugin) => valid.has(plugin.name));
  }

  public play(): void {
    this.running = true;
    this.#manager.on(this.#scrollHandler);
    this.#plugins.forEach((plugin) => plugin.play && plugin.play(this));
  }

  public pause(): void {
    this.running = false;
    this.#manager.off();
    this.#plugins.forEach((plugin) => plugin.pause && plugin.pause(this));
  }

  public destroy(): void {
    this.#plugins.forEach((plugin) => plugin.destroy && plugin.destroy());
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

  #register(plugin: HadesPlugin, id: string): void {
    if (typeof plugin.register === 'function') {
      plugin.register(this);
    }
    plugin.id = id;
    this.#plugins.push(plugin);
  }
}

export {
  type Aion,
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
