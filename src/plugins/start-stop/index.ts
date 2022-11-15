import Hades from "../..";
import { HadesPlugin } from "../../declarations";
import { StartStopOptions } from "./declarations";

class StartStop implements HadesPlugin {
  private _still : boolean = false;

  private context : Hades | null = null;
  private options : StartStopOptions;
  private startNeedEmission : boolean = true;
  private stopNeedEmission : boolean = false;

  public name : string = 'StartStop';

  constructor(options : Partial<StartStopOptions>) {
    const defaults : StartStopOptions = {
      emitGlobal: false,
      callbacks: {
        start: () => {},
        stop: () => {},
      },
      precision: 2,
    }

    this.options = { ...defaults, ...options };
  }

  public register(context : Hades) : void {
    this.context = context;
  }

  public render(context : Hades) : void {
    const vX = parseFloat(context.velocity.x.toFixed(this.options.precision));
    const vY = parseFloat(context.velocity.y.toFixed(this.options.precision));

    if (vX === 0 && vY === 0) {
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

  private emitStillChange(type : string) : void {
    if (this.options.emitGlobal) {
      const eventInit : CustomEventInit = {};
      const customEvent : CustomEvent = new CustomEvent(`hades-${type}`, eventInit);
      window.dispatchEvent(customEvent);
    }
  }

  public get still() {
    return this._still;
  }
}

export default StartStop;
