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

  constructor(options: Partial<VirtualRenderOptions>) {
    const defaults: VirtualRenderOptions = {
      scrollNode: document.body as HTMLElement,
      lockX: true,
      lockY: false,
      renderScroll: true,
      infiniteScroll: false,
      autoBoundaries: true,
      boundaries: new Boundaries(0, 0, 0, 0),
      precision: 4,
    };
    this.#options = { ...defaults, ...options };

    if (typeof this.#options.scrollNode === 'undefined') {
      // Headless mode: no node to transform, boundaries are external
      this.#options.infiniteScroll = true;
      this.#options.autoBoundaries = false;
      this.#options.renderScroll = false;
    } else {
      this.#options.scrollNode.style.webkitBackfaceVisibility = 'hidden';
      this.#options.scrollNode.style.backfaceVisibility = 'hidden';

      // Prefer a ResizeObserver over per-frame getBoundingClientRect polling:
      // boundaries are recomputed only when the container or the viewport
      // actually resizes, keeping layout reads out of the frame loop.
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
    // Fallback polling, used only when ResizeObserver is unavailable
    if (this.#options.autoBoundaries && this.#resizeObserver === null) {
      const now = performance.now();

      // Only recalculate boundaries every REFLOW_THROTTLE ms
      if (now - this.#lastFrame > this.#REFLOW_THROTTLE) {
        this.#computeBoundaries();
        this.#lastFrame = now;
      }
    }
  }

  #computeBoundaries(): void {
    const containerRect = this.#options.scrollNode.getBoundingClientRect();
    this.#options.boundaries = new Boundaries(
      0,
      containerRect.width - window.innerWidth,
      0,
      containerRect.height - window.innerHeight,
    );
  }

  public render(context: Hades): void {
    // Cache the precision to avoid lookups
    const { precision } = this.#options;
    const px = parseFloat((this.#options.lockX ? 0 : context.amount.x * -1).toFixed(precision));
    const py = parseFloat((this.#options.lockY ? 0 : context.amount.y * -1).toFixed(precision));

    // Use transform3d for hardware acceleration
    if (this.#options.renderScroll) {
      this.#options.scrollNode.style.transform = `translate3d(${px}px,${py}px,0)`;
    }
  }

  public scroll(context: Hades): void {
    // Clamp the external temp  to be inside the boundaries if not infinite scrolling
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
      window.removeEventListener('resize', this.#onResize);
    }
  }

  // Common getters and setters

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
