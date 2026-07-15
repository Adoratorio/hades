import { type HadesPlugin, type Vec2 } from '../../types.ts';
import type Hades from '../../index.ts';
import { type StartStopOptions } from './types.ts';

class StartStop implements HadesPlugin {
  private _still = false;
  private _prev: Vec2 = { x: 0, y: 0 };
  private _prevTs = 0;

  private options: StartStopOptions;
  private startNeedEmission = true;
  private stopNeedEmission = false;

  public name = 'StartStop';

  constructor(options: Partial<StartStopOptions>) {
    const defaults: StartStopOptions = {
      scrollNode: window,
      emitGlobal: false,
      callbacks: {
        start: () => {},
        stop: () => {},
      },
      precision: 2,
      mobileDelay: 500,
    };

    this.options = { ...defaults, ...options };
  }

  public register(_context: Hades): void {
    // The context is intentionally not stored: this plugin only reads from the render hook
  }

  public render(context: Hades): void {
    if (window.matchMedia('(pointer: fine)').matches) {
      const vX = parseFloat(context.velocity.x.toFixed(this.options.precision));
      const vY = parseFloat(context.velocity.y.toFixed(this.options.precision));

      this.check(vX, vY);
    } else {
      const ts = Date.now();
      const delta = ts - this._prevTs;

      if (!window.matchMedia('(pointer: fine)').matches) {
        const isWindow = this.options.scrollNode === window;
        const node = this.options.scrollNode as HTMLElement;
        const vX = (isWindow ? window.scrollX : node.scrollLeft) - this._prev.x;
        const vY = (isWindow ? window.scrollY : node.scrollTop) - this._prev.y;

        if (delta > this.options.mobileDelay) {
          this._prevTs = ts;
          this.check(vX, vY);
        }

        this._prev = {
          x: isWindow ? window.scrollX : node.scrollLeft,
          y: isWindow ? window.scrollY : node.scrollTop,
        };
      }
    }
  }

  private check(x: number, y: number): void {
    if (x === 0 && y === 0) {
      this._still = true;
      if (this.stopNeedEmission) {
        this.options.callbacks.stop(this);
        this.emitStillChange('stop');
        this.stopNeedEmission = false;
        this.startNeedEmission = true;
      }
    } else {
      this._still = false;
      if (this.startNeedEmission) {
        this.options.callbacks.start(this);
        this.emitStillChange('start');
        this.startNeedEmission = false;
        this.stopNeedEmission = true;
      }
    }
  }

  private emitStillChange(type: string): void {
    if (this.options.emitGlobal) {
      const eventInit: CustomEventInit = {};
      const customEvent: CustomEvent = new CustomEvent(`hades-${type}`, eventInit);
      window.dispatchEvent(customEvent);
    }
  }

  public get still(): boolean {
    return this._still;
  }
}

export default StartStop;
