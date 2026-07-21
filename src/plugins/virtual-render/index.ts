import Boundaries from '../../Boundaries.ts';
import { type HadesPlugin } from '../../types.ts';
import type Hades from '../../index.ts';
import { type VirtualRenderOptions } from './types.ts';

class VirtualRender implements HadesPlugin {
  #context: Hades | null = null;
  #options: VirtualRenderOptions;
  #lastFrame = 0;
  readonly #REFLOW_THROTTLE = 100;
  #resizeObserver: ResizeObserver | null = null;
  #onResize = (): void => {
    this.#computeBoundaries();
  };

  public name = 'VirtualRender';

  constructor(options: Partial<VirtualRenderOptions> = {}) {
    const defaults: VirtualRenderOptions = {
      scrollNode: typeof document !== 'undefined' ? document.body : ({} as HTMLElement),
      lockX: true,
      lockY: false,
      renderScroll: true,
      infiniteScroll: false,
      autoBoundaries: true,
      boundaries: new Boundaries(0, 0, 0, 0),
      precision: 4,
    };

    this.#options = { ...defaults, ...options };

    if (typeof this.#options.scrollNode === 'undefined' || !this.#options.scrollNode.style) {
      this.#options.infiniteScroll = true;
      this.#options.autoBoundaries = false;
      this.#options.renderScroll = false;
    } else {
      this.#options.scrollNode.style.webkitBackfaceVisibility = 'hidden';
      this.#options.scrollNode.style.backfaceVisibility = 'hidden';

      if (this.#options.autoBoundaries && typeof ResizeObserver !== 'undefined') {
        this.#resizeObserver = new ResizeObserver(this.#onResize);
        this.#resizeObserver.observe(this.#options.scrollNode);
        window.addEventListener('resize', this.#onResize);
        this.#computeBoundaries();
      }
    }
  }

  public register(context: Hades): void {
    this.#context = context;
  }

  public preFrame(_context: Hades): void {
    if (this.#options.autoBoundaries && this.#resizeObserver === null) {
      const now = performance.now();
      if (now - this.#lastFrame > this.#REFLOW_THROTTLE) {
        this.#computeBoundaries();
        this.#lastFrame = now;
      }
    }
  }

  #computeBoundaries(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const containerRect = this.#options.scrollNode.getBoundingClientRect();

    // Safety: never allow negative boundaries
    this.#options.boundaries = new Boundaries(
      0,
      Math.max(0, containerRect.width - window.innerWidth),
      0,
      Math.max(0, containerRect.height - window.innerHeight),
    );
  }

  public render(context: Hades): void {
    const factor = 10 ** this.#options.precision;

    // GC optimization: mathematical rounding
    const px = this.#options.lockX ? 0 : Math.round(context.amount.x * -1 * factor) / factor;
    const py = this.#options.lockY ? 0 : Math.round(context.amount.y * -1 * factor) / factor;

    if (this.#options.renderScroll) {
      this.#options.scrollNode.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    }
  }

  public scroll(context: Hades): void {
    if (!this.#options.infiniteScroll) {
      context.internalTemp = {
        x: Math.min(
          Math.max(context.internalTemp.x, this.#options.boundaries.min.x),
          this.#options.boundaries.max.x,
        ),
        y: Math.min(
          Math.max(context.internalTemp.y, this.#options.boundaries.min.y),
          this.#options.boundaries.max.y,
        ),
      };
    }
  }

  public startRender(): void {
    this.#options.renderScroll = true;
  }

  public stopRender(): void {
    this.#options.renderScroll = false;
  }

  public destroy(): void {
    if (this.#resizeObserver !== null) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = null;
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', this.#onResize);
      }
    }
  }

  public set infiniteScroll(infiniteScroll: boolean) {
    this.#options.infiniteScroll = infiniteScroll;
  }
  public get boundaries(): Boundaries {
    return this.#options.boundaries;
  }
  public set boundaries(boundaries: Boundaries) {
    this.#options.boundaries = boundaries;
    if (this.#context !== null) {
      if (this.#context.amount.y > this.#options.boundaries.max.y) {
        this.#context.scrollTo({ y: this.#options.boundaries.max.y }, 0);
      }
      if (this.#context.amount.x > this.#options.boundaries.max.x) {
        this.#context.scrollTo({ x: this.#options.boundaries.max.x }, 0);
      }
    }
  }
}

export default VirtualRender;
