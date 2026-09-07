import { type HadesPlugin, type Vec2 } from '../../types.ts';
import type Hades from '../../index.ts';
import { getScrollPosition } from '../../utils.ts';
import { type StartStopOptions } from './types.ts';

class StartStop implements HadesPlugin {
  #still = false;
  #prev: Vec2 = { x: 0, y: 0 };
  #prevTs = 0;
  #options: StartStopOptions;
  #startNeedEmission = true;
  #stopNeedEmission = false;

  #pointerFineMQL: MediaQueryList | null = null;
  #pointerFine = true;

  #onPointerChange = (event: MediaQueryListEvent): void => {
    this.#pointerFine = event.matches;
  };

  public name = 'StartStop';

  constructor(options: Partial<StartStopOptions> = {}) {
    const defaults: StartStopOptions = {
      scrollNode: typeof window !== 'undefined' ? window : ({} as Window),
      emitGlobal: false,
      callbacks: {
        start: () => {},
        stop: () => {},
      },
      precision: 2,
      mobileDelay: 500,
    };
    this.#options = {
      ...defaults,
      ...options,
      callbacks: { ...defaults.callbacks, ...options.callbacks },
    };

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.#pointerFineMQL = window.matchMedia('(pointer: fine)');
      this.#pointerFine = this.#pointerFineMQL.matches;
      this.#pointerFineMQL.addEventListener('change', this.#onPointerChange);
    }
  }

  public render(context: Hades): void {
    if (this.#pointerFine) {
      // GC optimization
      const factor = 10 ** this.#options.precision;
      const vX = Math.round(context.velocity.x * factor) / factor;
      const vY = Math.round(context.velocity.y * factor) / factor;
      this.#check(vX, vY);
      return;
    }

    // Coarse pointers scroll natively: sample the scroll position every
    // `mobileDelay` ms and compare with the previous sample, so any movement
    // inside the window counts
    const ts = Date.now();
    if (ts - this.#prevTs < this.#options.mobileDelay) {
      return;
    }
    const current = getScrollPosition(this.#options.scrollNode);
    this.#check(current.x - this.#prev.x, current.y - this.#prev.y);
    this.#prev = current;
    this.#prevTs = ts;
  }

  #check(x: number, y: number): void {
    if (x === 0 && y === 0) {
      this.#still = true;
      if (this.#stopNeedEmission) {
        this.#options.callbacks.stop(this);
        this.#emitStillChange('stop');
        this.#stopNeedEmission = false;
        this.#startNeedEmission = true;
      }
    } else {
      this.#still = false;
      if (this.#startNeedEmission) {
        this.#options.callbacks.start(this);
        this.#emitStillChange('start');
        this.#startNeedEmission = false;
        this.#stopNeedEmission = true;
      }
    }
  }

  #emitStillChange(type: string): void {
    if (this.#options.emitGlobal && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`hades-${type}`));
    }
  }

  public destroy(): void {
    if (this.#pointerFineMQL !== null) {
      this.#pointerFineMQL.removeEventListener('change', this.#onPointerChange);
      this.#pointerFineMQL = null;
    }
  }

  public get still(): boolean {
    return this.#still;
  }
}

export default StartStop;
