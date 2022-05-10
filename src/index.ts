import Aion from '@adoratorio/aion';
import Hermes from '@adoratorio/hermes';
import { HermesEvent } from '@adoratorio/hermes/dist/declarations';
import {
  MODE,
  DIRECTION,
  TRACK,
  HadesOptions,
  Boundaries,
  Vec2,
  Timeline,
  Easing,
} from "./declarations";
import Easings from "./easing";
import Scrollbar from "./scrollbar";

class Hades {
  static EASING = Easings;
  static MODE = MODE;
  static DIRECTION = DIRECTION;
  static TRACK = TRACK;

  private _amount : Vec2 = { x: 0, y: 0 };

  private options : HadesOptions;
  private engine : Aion;
  private manager : Hermes;
  private scrollHandler : Function;
  private frameHandler : Function;
  private timeline : Timeline;
  private prevDirection : Vec2 = { x: Hades.DIRECTION.INITIAL, y: Hades.DIRECTION.INITIAL };
  private prevAmount : Vec2 = { x: 0, y: 0 };
  private sections : Array<HTMLElement> = [];
  private automaticScrolling : boolean = false;
  private imediateScrolling : boolean = false;
  private scrollbar : Scrollbar | null = null;
  private stopNeedEmission : boolean = false;
  private startNeedEmission : boolean = true;
  private aionId : string = `hades-frame-${Date.now()}`;

  public amount : Vec2 = { x: 0, y: 0 };
  public velocity : Vec2 = { x: 0, y: 0 };
  public running : boolean = false;
  public still : boolean = true;

  constructor(options : Partial<HadesOptions>) {
    const defaults : HadesOptions = {
      mode: MODE.VIRTUAL,
      viewport: document.querySelector('.hades-viewport') as HTMLElement,
      container: document.querySelector('.hades-container') as HTMLElement,
      mimo: false,
      easing: {
        mode: Easings.LINEAR,
        duration: 1000,
      },
      infiniteScroll: false,
      emitGlobal: true,
      callbacks: {
        frame: () => {},
        scroll: () => {},
      },
      renderByPixel: true,
      lockX: true,
      lockY: false,
      boundaries: Hades.createBoundaries(0, 0, 0, 0),
      autoBoundaries: true,
      sections: false,
      loop: false,
      autoplay: true,
      aion: null,
      touchMultiplier: 1.5,
      smoothDirectionChange: false,
      renderScroll: true,
      scrollbar: {
        tracks: [TRACK.Y],
      },
      scale: 1,
      uniqueDirection: false,
      threshold: {
        x: 0,
        y: 3,
      },
      startStopPrecision: 4,
    };
    this.options = { ...defaults, ...options };
    if (typeof this.options.callbacks.frame === 'undefined') this.options.callbacks.frame = () => {};
    if (typeof this.options.callbacks.scroll === 'undefined') this.options.callbacks.scroll = () => {};

    this.timeline = {
      start: 0,
      duration: this.options.easing.duration,
      initial: { x: 0, y: 0 },
      final: { x: 0, y: 0 },
      current: { x: 0, y: 0 },
    };
    this.scrollHandler = (event : HermesEvent) => this.scroll(event);
    this.frameHandler = (delta : number) => this.frame(delta);

    if (this.options.viewport === null || typeof this.options.viewport === 'undefined') {
      throw new Error('Viewport cannot be undefined');
    }
    if (this.options.container === null || typeof this.options.container === 'undefined') {
      throw new Error('Container cannot be undefined');
    }
    if (this.options.loop && !this.options.sections && !this.options.infiniteScroll) {
      throw new Error('Cannot have a loop without sections and infiniteScroll enabled');
    }
    if (
      this.options.mimo && 
      (typeof this.options.mimo.viewport === 'undefined' || typeof this.options.mimo.container === 'undefined')
    ) {
      throw new Error('Cannot use MIMO mode without a mimo container and viewport');
    }

    // If sections are setted load the nodes
    if (this.virtual && this.options.sections) {
      const selector = typeof this.options.sections === 'string' ? this.options.sections : '.hades-section';
      this.sections = Array.from(document.querySelectorAll(selector)) as Array<HTMLElement>;
    }

    // Set base css for performance boost
    this.options.container.style.webkitBackfaceVisibility = 'hidden';
    this.options.container.style.backfaceVisibility = 'hidden';

    // If mimo mode set the css for the mimo container
    if (this.options.mimo) {
      const containerRect = this.options.container.getBoundingClientRect();
      (this.options.mimo.container as HTMLElement).style.height = `${containerRect.height}px`;
      (this.options.mimo.container as HTMLElement).style.width = `${containerRect.width}px`;
    }

    // Atach and listen to events
    if (this.options.mimo) {
      this.manager = new Hermes({
        mode: MODE.NATIVE,
        container: this.options.mimo.viewport,
        hook: this.options.mimo.container,
        touchMultiplier: this.options.touchMultiplier,
      });
    } else {
      this.manager = new Hermes({
        mode: this.options.mode,
        container: this.options.viewport,
        hook: this.options.container,
        touchMultiplier: this.options.touchMultiplier,
      });
    }
    this.manager.on(this.scrollHandler);

    // Check and initialize Aion
    if (this.options.autoplay) this.running = true;
    if (this.options.aion === null || typeof this.options.aion === 'undefined') {
      this.engine = new Aion();
    } else {
      this.engine = this.options.aion;
    }

    if (this.options.scrollbar !== null && this.options.mode === Hades.MODE.VIRTUAL) {
      this.scrollbar = new Scrollbar(this.options.scrollbar, this, this.options.viewport);
    }

    this.engine.add(this.frameHandler, this.aionId);
    this.engine.start();
  }

  private frame(delta : number) : void {
    // If boundires are autosetted use the container dimensions
    if (this.options.autoBoundaries) {
      const containerRect = this.options.container.getBoundingClientRect();
      const viewportRect = this.virtual ? this.options.viewport.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
      this.options.boundaries = Hades.createBoundaries(
        0,
        containerRect.width < viewportRect.width ? 0 : containerRect.width - viewportRect.width,
        0,
        containerRect.height < viewportRect.height ? 0 : containerRect.height - viewportRect.height,
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
      x: this.timeline.current.x,
      y: this.timeline.current.y,
    };
    const roundedCurrent : Vec2 = {
      x: Math.round(this.timeline.current.x),
      y: Math.round(this.timeline.current.y),
    }
    this.amount = this.options.renderByPixel ? roundedCurrent : current;

    // Apply transformation in case of non section method
    if ((this.virtual || this.mimo) && this.options.renderScroll && !this.options.sections) {
      const px = this.options.lockX ? 0 : this.amount.x * -1;
      const py = this.options.lockY ? 0 : this.amount.y * -1;
      const prop = `translate3d(${px}px, ${py}px, 0px)`;
      this.options.container.style.transform = prop;
    }

    // Calculate transform based on prev frame amount and transform if section method
    if (this.virtual && this.options.sections) {
      const sectionsWidth : Array<number> = [];
      const sectionsHeight : Array<number> = [];
      const sectionLeft: Array<number> = [];

      this.sections.forEach((section) => {
        const { width, height, left } = section.getBoundingClientRect();
        sectionsWidth.push(width)
        sectionsHeight.push(height);
        sectionLeft.push(left);
      });

      this.sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        let prevSectionsWidth = 0;
        let prevSectionsHeight = 0;

        for (let i = 0; i < index; i++) {
          prevSectionsWidth += sectionsWidth[i];
          prevSectionsHeight += sectionsHeight[i];
        }

        // Check if we need to translate this section

        if (!this.options.loop) {
          if (!this.options.lockX &&
            this.prevAmount.x > prevSectionsWidth - window.innerWidth &&
            this.prevAmount.x < prevSectionsWidth + rect.width) {
            const px = this.options.lockX ? 0 : this.amount.x * -1;
            section.style.transform = `translate3d(${px}px, 0px, 0px)`;
          }

          if (!this.options.lockY &&
            this.prevAmount.y > prevSectionsHeight - window.innerHeight &&
            this.prevAmount.y < prevSectionsHeight + rect.height) {
            const py = this.options.lockY ? 0 : this.amount.y * -1;
            section.style.transform = `translate3d(0px, ${py}px, 0px)`;
          }
        }

        if (this.options.loop) {
          if (!this.options.lockX) {
            const blockSize = this.boundaries.max.x + window.innerWidth;
            const multiplier = Math.floor(this.prevAmount.x / blockSize);
            const leftSide = this.prevAmount.x - blockSize * multiplier;

            if (prevSectionsWidth + rect.width > leftSide) {
              const px = this.options.lockX ? 0 : (this.amount.x - multiplier * blockSize) * -1;
              section.style.transform = `translate3d(${px}px, 0px, 0px)`;
            } else {
              const px = this.options.lockX ? 0 : (this.amount.x - multiplier * blockSize - this.boundaries.max.x - window.innerWidth) * -1;
              section.style.transform = `translate3d(${px}px, 0px, 0px)`;
            }
          }

          if (!this.options.lockY) {
            const blockSize = this.boundaries.max.y + window.innerHeight;
            const multiplier = Math.floor(this.prevAmount.y / blockSize);
            const topSide = this.prevAmount.y - blockSize * multiplier;

            if (prevSectionsHeight + rect.height > topSide) {
              const py = this.options.lockY ? 0 : (this.amount.y - multiplier * blockSize) * -1;
              section.style.transform = `translate3d(0px, ${py}px, 0px)`;
            } else {
              const py = this.options.lockY ? 0 : (this.amount.y - multiplier * blockSize - this.boundaries.max.y - window.innerHeight) * -1;
              section.style.transform = `translate3d(0px, ${py}px, 0px)`;
            }
          }
        }
      });
    }

    // Calculate the speed
    this.velocity = {
      x: Math.abs((current.x - this.prevAmount.x) / delta),
      y: Math.abs((current.y - this.prevAmount.y) / delta),
    }
    // Use 4 digits precision
    this.velocity.x = parseFloat(this.velocity.x.toFixed(this.options.startStopPrecision));
    this.velocity.y = parseFloat(this.velocity.y.toFixed(this.options.startStopPrecision));
    this.prevAmount = current;

    // Check if the scroll is still animating or not
    if (this.velocity.y === 0 && this.velocity.x === 0) {
      this.still = true;
      if (this.stopNeedEmission) {
        this.emitStillChange('stop');
        this.stopNeedEmission = false;
        this.startNeedEmission = true;
      }
    } else {
      this.still = false;
      if (this.startNeedEmission) {
        this.emitStillChange('start');
        this.startNeedEmission = false;
        this.stopNeedEmission = true;
      }
    }

    // Update scrollbar tracks
    if (this.options.scrollbar !== null && this.scrollbar !== null) {
      this.scrollbar.listen(this.amount);
    }

    // Reset the initial position of the timeline for the next frame
    this.timeline.initial = this.timeline.current;
    this.options.callbacks.frame();

    // Update the amount in case of native scroll
    if (this.native) {
      this.amount.x = this.options.viewport.scrollLeft;
      this.amount.y = this.options.viewport.scrollTop;
    }
  }

  private scroll(event : HermesEvent) : void {
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

    // Multiply the scroll by the options multiplier
    event.delta.x = this.options.uniqueDirection ? (event.delta.x || event.delta.y) * this.options.scale : event.delta.x * this.options.scale;
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

    // Check the scroll direction
    const currentXDirection = event.delta.x > 0 ? Hades.DIRECTION.DOWN : Hades.DIRECTION.UP;
    const currentYDirection = event.delta.y > 0 ? Hades.DIRECTION.DOWN : Hades.DIRECTION.UP;
    if (!this.options.smoothDirectionChange) {
      if (currentXDirection !== this.prevDirection.x) this._amount.x = this.amount.x;
      if (currentYDirection !== this.prevDirection.y) this._amount.y = this.amount.y;
    }
    this.prevDirection.x = currentXDirection;
    this.prevDirection.y = currentYDirection;

    // Emit the event and call the callback
    if (this.options.emitGlobal) {
      const eventInit : CustomEventInit = {};
      eventInit.detail = event;
      const customEvent : CustomEvent = new CustomEvent('hades-scroll', eventInit);
      window.dispatchEvent(customEvent);
    }
    this.options.callbacks.scroll(event);
  }

  private emitStillChange(type : string) {
    if (this.options.emitGlobal) {
      const eventInit : CustomEventInit = {};
      const customEvent : CustomEvent = new CustomEvent(`hades-${type}`, eventInit);
      window.dispatchEvent(customEvent);
    }
  }

  public scrollTo(position : Partial<Vec2>, duration : number) {
    if (this.virtual) {
      if (duration > 0) {
        this.automaticScrolling = true;
        this.timeline.duration = duration;
      } else {
        this.imediateScrolling = true;
      }
    } else {
      this.options.viewport.scroll({
        left: position.x,
        top: position.y,
        behavior: duration === 0 ? 'auto' : 'smooth',
      });
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
    if (this.scrollbar !== null) this.scrollbar.destroy();
    this.manager.destroy();
    this.engine.remove(this.aionId);

    // @ts-expect-error
    delete this.manager;
    // @ts-expect-error
    delete this.engine;
  }

  // Common getter for retriving props

  public get virtual() {
    return this.options.mode === Hades.MODE.VIRTUAL;
  }

  public get mimo() {
    return this.options.mode === Hades.MODE.MIMO;
  }

  public get native() {
    return this.options.mode === Hades.MODE.NATIVE;
  }

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

  public set emitGlobal(emitGlobal : boolean) {
    this.options.emitGlobal = emitGlobal;
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

  public set renderScroll(renderScroll : boolean) {
    this.options.renderScroll = renderScroll;
  }

  // Some utils

  public static createBoundaries(xMin : number, xMax : number, yMin : number, yMax : number) : Boundaries {
    const boundaries : Boundaries = {
      min: { x: xMin, y: yMin },
      max: { x: xMax, y: yMax }
    };
    return boundaries;
  }
}

export default Hades;
