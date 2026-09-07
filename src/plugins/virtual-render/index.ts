import { defaultBody } from '../../utils.ts';
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
  #lastTransform = '';
  #originalTransform = '';
  #originalBackface = '';
  #originalWebkitBackface = '';
  #onResize = (): void => {
    this.#computeBoundaries();
  };

  public name = 'VirtualRender';

  constructor(options: Partial<VirtualRenderOptions> = {}) {
    const defaults: VirtualRenderOptions = {
      scrollNode: options.scrollNode ?? defaultBody(),
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
      this.#originalTransform = this.#options.scrollNode.style.transform;
      this.#originalBackface = this.#options.scrollNode.style.backfaceVisibility;
      this.#originalWebkitBackface = this.#options.scrollNode.style.webkitBackfaceVisibility;
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
    // Layout size (transforms excluded): the node is translated while scrolling
    const { offsetWidth, offsetHeight } = this.#options.scrollNode;

    // Safety: never allow negative boundaries
    this.boundaries = new Boundaries(
      0,
      Math.max(0, offsetWidth - window.innerWidth),
      0,
      Math.max(0, offsetHeight - window.innerHeight),
    );
  }

  public render(context: Hades): void {
    if (!this.#options.renderScroll) {
      return;
    }

    const factor = 10 ** this.#options.precision;
    const px = this.#options.lockX ? 0 : Math.round(context.amount.x * -1 * factor) / factor;
    const py = this.#options.lockY ? 0 : Math.round(context.amount.y * -1 * factor) / factor;

    // Skip the style write when the position has not changed
    const transform = `translate3d(${px}px, ${py}px, 0)`;
    if (transform === this.#lastTransform) {
      return;
    }
    this.#lastTransform = transform;
    this.#options.scrollNode.style.transform = transform;
  }

  public scroll(context: Hades): void {
    if (!this.#options.infiniteScroll) {
      const { min, max } = this.#options.boundaries;
      context.internalTemp = {
        x: Math.min(Math.max(context.internalTemp.x, min.x), max.x),
        y: Math.min(Math.max(context.internalTemp.y, min.y), max.y),
      };
    }
  }

  public scrollTo(context: Hades): void {
    if (!this.#options.infiniteScroll) {
      const { min, max } = this.#options.boundaries;
      context.internalAmount = {
        x: Math.min(Math.max(context.internalAmount.x, min.x), max.x),
        y: Math.min(Math.max(context.internalAmount.y, min.y), max.y),
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
    const style = this.#options.scrollNode?.style;
    if (style) {
      if (style.transform === this.#lastTransform) {
        style.transform = this.#originalTransform;
      }
      if (style.backfaceVisibility === 'hidden') {
        style.backfaceVisibility = this.#originalBackface;
      }
      if (style.webkitBackfaceVisibility === 'hidden') {
        style.webkitBackfaceVisibility = this.#originalWebkitBackface;
      }
    }
    this.#context = null;
    if (this.#resizeObserver !== null) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = null;
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', this.#onResize);
      }
    }
  }

  public get scrollNode(): HTMLElement {
    return this.#options.scrollNode;
  }
  public get infiniteScroll(): boolean {
    return this.#options.infiniteScroll;
  }
  public set infiniteScroll(infiniteScroll: boolean) {
    this.#options.infiniteScroll = infiniteScroll;
  }
  public get boundaries(): Boundaries {
    return this.#options.boundaries;
  }
  public set boundaries(boundaries: Boundaries) {
    this.#options.boundaries = boundaries;
    if (this.#context !== null && !this.#options.infiniteScroll) {
      const { min, max } = boundaries;
      const current = this.#context.amount;
      const destination = this.#context.internalAmount;
      const outside = (point: { x: number; y: number }): boolean =>
        point.x < min.x || point.x > max.x || point.y < min.y || point.y > max.y;
      if (outside(current)) {
        this.#context.scrollTo(
          {
            x: Math.min(Math.max(current.x, min.x), max.x),
            y: Math.min(Math.max(current.y, min.y), max.y),
          },
          0,
          true,
        );
      } else if (outside(destination)) {
        this.scrollTo(this.#context);
      }
    }
  }
}

export default VirtualRender;
