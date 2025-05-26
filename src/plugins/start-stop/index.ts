import Hades from "../..";
import { HadesPlugin, Vec2 } from "../../declarations";
import { StartStopOptions } from "./declarations";

class StartStop implements HadesPlugin {
  private _still: boolean = false;
  private _prev: Vec2 = { x: 0, y: 0 };
  private _prevTs: number = 0;

  private context: Hades | null = null;
  private options: StartStopOptions;
  private startNeedEmission: boolean = true;
  private stopNeedEmission: boolean = false;

  public name: string = 'StartStop';

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
    }

    this.options = { ...defaults, ...options };
  }

  public register(context: Hades): void {
    this.context = context;
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
        const propX = this.options.scrollNode === window ? 'scrollX' : 'scrollLeft';
        const propY = this.options.scrollNode === window ? 'scrollY' : 'scrollTop';
        const vX = (this.options.scrollNode as any)[propX] - this._prev.x;
        const vY = (this.options.scrollNode as any)[propY] - this._prev.y;
      
        if (delta > this.options.mobileDelay) {
          this._prevTs = ts;
          this.check(vX, vY);
        }
      
        this._prev = {
          x: (this.options.scrollNode as any)[propX],
          y: (this.options.scrollNode as any)[propY],
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

  public get still() {
    return this._still;
  }
}

export default StartStop;
