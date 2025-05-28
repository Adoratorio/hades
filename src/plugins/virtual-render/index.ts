import Hades from "../..";
import Boundaries from "../../Boundaries";
import { HadesPlugin } from "../../declarations";
import { VirtualRenderOptions } from "./declarations";

class VirtualRender implements HadesPlugin {
  private context: Hades | null = null;
  private options: VirtualRenderOptions;
  private lastFrame: number = 0;
  private readonly REFLOW_THROTTLE = 100;

  public name: string = 'VirtualRender';

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
    this.options = { ...defaults, ...options };

    if (typeof this.options.scrollNode === 'undefined') {
      this.options.infiniteScroll = true;
      this.options.autoBoundaries = false;
    }

    this.options.scrollNode.style.webkitBackfaceVisibility = 'hidden';
    this.options.scrollNode.style.backfaceVisibility = 'hidden';
  }

  public register(context: Hades): void {
    this.context = context;
  }

  // @ts-ignore
  public preFrame(context: Hades): void {
    // If boundires are autosetted use the container dimensions
    if (this.options.autoBoundaries) {
      const now = performance.now();

      // Only recalculate boundaries every REFLOW_THROTTLE ms
      if (now - this.lastFrame > this.REFLOW_THROTTLE) {
        const containerRect = this.options.scrollNode.getBoundingClientRect();
        this.options.boundaries = new Boundaries(
          0,
          containerRect.width - window.innerWidth,
          0,
          containerRect.height - window.innerHeight,
        );
        this.lastFrame = now;
      }
    }
  }

  public render(context: Hades): void {
    // Cache the precision to avoid lookups
    const { precision } = this.options;
    const px = parseFloat((this.options.lockX ? 0 : context.amount.x * -1).toFixed(precision));
    const py = parseFloat((this.options.lockY ? 0 : context.amount.y * -1).toFixed(precision));
    
    // Use transform3d for hardware acceleration
    if (this.options.renderScroll) {
      this.options.scrollNode.style.transform = `translate3d(${px}px,${py}px,0)`;
    }
  }

  public scroll(context: Hades): void {
    // Clamp the external temp  to be inside the boundaries if not infinite scrolling
    if (!this.options.infiniteScroll) {
      context.internalTemp = {
        x: Math.min(Math.max(context.internalTemp.x, this.options.boundaries.min.x), this.options.boundaries.max.x),
        y: Math.min(Math.max(context.internalTemp.y, this.options.boundaries.min.y), this.options.boundaries.max.y),
      }
    }
  }

  public startRender(): void {
    this.options.renderScroll = true;
  }

  public stopRender(): void {
    this.options.renderScroll = false;
  }

  // Common getters and setters

  public get boundaries() {
    return this.options.boundaries;
  }

  public set infiniteScroll(infiniteScroll: boolean) {
    this.options.infiniteScroll = infiniteScroll;
  }

  public set boundaries(boundaries: Boundaries) {
    this.options.boundaries = boundaries;

    if (this.context !== null) {
      if (this.context.amount.y > this.options.boundaries.max.y) {
        this.context.scrollTo({ y: this.options.boundaries.max.y }, 0);
      }
      if (this.context.amount.x > this.options.boundaries.max.x) {
        this.context.scrollTo({ x: this.options.boundaries.max.x }, 0);
      }
    }
  }
}

export default VirtualRender;
