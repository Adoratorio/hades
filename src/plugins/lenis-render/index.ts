import Boundaries from '../../Boundaries.ts';
import { type HadesPlugin, type HermesEvent, type Vec2 } from '../../types.ts';
import type Hades from '../../index.ts';
import { getScrollPosition, isScrollableElement } from '../../utils.ts';
import { type LenisRenderOptions } from './types.ts';

class LenisRender implements HadesPlugin {
  #context: Hades | null = null;
  #options: LenisRenderOptions;
  #nativeScrollHandler: (event: Event) => void;
  #boundHandler: () => void;
  #resizeObserver: ResizeObserver | null = null;
  #bound: Vec2 = { x: 0, y: 0 };
  #isValidEvent = false;
  #interval: number | null = null;

  public name = 'LenisRender';

  constructor(options: Partial<LenisRenderOptions> = {}) {
    const defaults: LenisRenderOptions = {
      scrollNode: typeof window !== 'undefined' ? window : ({} as Window),
      renderScroll: true,
    };
    this.#options = { ...defaults, ...options };

    this.#nativeScrollHandler = (e: Event): void => this.#nativeScroll(e);
    this.#boundHandler = (): void => this.#computeBound();

    if (typeof this.#options.scrollNode === 'undefined') {
      throw new Error('[Hades] Invalid Scroll Node for Lenis Renderer');
    }

    if (typeof window !== 'undefined') {
      this.#options.scrollNode.addEventListener('scroll', this.#nativeScrollHandler);
      // Cache the scroll bounds and refresh them on resize instead of reading
      // layout (scrollWidth/clientWidth/…) on every wheel event.
      window.addEventListener('resize', this.#boundHandler, { passive: true });
      const measureNode = this.#getMeasureNode();
      if (typeof ResizeObserver !== 'undefined' && measureNode !== null) {
        this.#resizeObserver = new ResizeObserver(this.#boundHandler);
        this.#resizeObserver.observe(measureNode);
      }
      this.#computeBound();
    }
  }

  public register(context: Hades): void {
    this.#context = context;
  }

  public wheel(_context: Hades, event: HermesEvent): boolean {
    if (
      (event.originalEvent.target as HTMLElement).parentNode !== this.#options.scrollNode &&
      isScrollableElement(event.originalEvent.target as HTMLElement)
    ) {
      return true;
    }

    if (event.type === 'wheel') {
      event.originalEvent.preventDefault();
      this.#isValidEvent = true;
    } else {
      this.#isValidEvent = false;
    }

    return false;
  }

  public render(context: Hades): void {
    if (this.#options.renderScroll && this.#isValidEvent && typeof window !== 'undefined') {
      this.#options.scrollNode.scrollTo(context.amount.x, context.amount.y);
    }
  }

  #getMeasureNode(): HTMLElement | null {
    if (typeof window === 'undefined') {
      return null;
    }
    if (this.#options.scrollNode === window) {
      return document.body;
    }
    return this.#options.scrollNode as HTMLElement;
  }

  #computeBound(): void {
    const node = this.#getMeasureNode();
    if (node === null) {
      return;
    }
    const isWindow = this.#options.scrollNode === window;
    this.#bound = {
      x: node.scrollWidth - (isWindow ? window.innerWidth : node.clientWidth),
      y: node.scrollHeight - (isWindow ? window.innerHeight : node.clientHeight),
    };
  }

  public scroll(context: Hades, _event: HermesEvent): void {
    context.internalTemp = {
      x: Math.min(Math.max(context.internalTemp.x, 0), this.#bound.x),
      y: Math.min(Math.max(context.internalTemp.y, 0), this.#bound.y),
    };
  }

  #nativeScroll(_event: Event): void {
    if (this.#context && !this.#isValidEvent && typeof window !== 'undefined') {
      this.#context.scrollTo(getScrollPosition(this.#options.scrollNode), 0, true);
    }

    if (typeof window !== 'undefined') {
      if (this.#interval) {
        window.clearTimeout(this.#interval);
      }
      this.#interval = window.setTimeout(() => {
        this.#isValidEvent = false;
      }, 100);
    }
  }

  public scrollTo(): void {
    this.#isValidEvent = true;
  }

  public destroy(): void {
    if (typeof window !== 'undefined') {
      if (this.#interval) {
        window.clearTimeout(this.#interval);
      }
      this.#options.scrollNode.removeEventListener('scroll', this.#nativeScrollHandler);
      window.removeEventListener('resize', this.#boundHandler);
    }
    if (this.#resizeObserver !== null) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = null;
    }
  }

  public startRender(): void {
    this.#options.renderScroll = true;
  }

  public stopRender(): void {
    this.#options.renderScroll = false;
  }

  public swapScrollNode(node: HTMLElement | Window): void {
    node.addEventListener('scroll', this.#nativeScrollHandler);
    this.#options.scrollNode.removeEventListener('scroll', this.#nativeScrollHandler);
    this.#options.scrollNode = node;
    if (this.#resizeObserver !== null) {
      this.#resizeObserver.disconnect();
      const measureNode = this.#getMeasureNode();
      if (measureNode !== null) {
        this.#resizeObserver.observe(measureNode);
      }
    }
    this.#computeBound();
  }

  public get boundaries(): Boundaries {
    if (typeof window !== 'undefined' && this.#options.scrollNode === window) {
      return new Boundaries(
        0,
        document.body.scrollWidth - document.body.clientWidth,
        0,
        document.body.scrollHeight - document.body.clientHeight,
      );
    }
    const node = this.#options.scrollNode as HTMLElement;
    return new Boundaries(
      0,
      node.scrollWidth ? node.scrollWidth - node.clientWidth : 0,
      0,
      node.scrollHeight ? node.scrollHeight - node.clientHeight : 0,
    );
  }
}

export default LenisRender;
