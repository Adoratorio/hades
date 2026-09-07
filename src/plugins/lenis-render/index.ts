import { defaultWindow, getScrollPosition, canScrollWithin } from '../../utils.ts';
import Boundaries from '../../Boundaries.ts';
import { type HadesPlugin, type HermesEvent, type Vec2 } from '../../types.ts';
import type Hades from '../../index.ts';
import { type LenisRenderOptions } from './types.ts';

class LenisRender implements HadesPlugin {
  #context: Hades | null = null;
  #options: LenisRenderOptions;
  #nativeScrollHandler: (event: Event) => void;
  #boundHandler: () => void;
  #resizeObserver: ResizeObserver | null = null;
  #observed = new Set<Element>();
  #dirty = true;
  #mutationObserver: MutationObserver | null = null;
  #bound: Vec2 = { x: 0, y: 0 };
  #isValidEvent = false;
  #interval: number | null = null;

  public name = 'LenisRender';

  constructor(options: Partial<LenisRenderOptions> = {}) {
    const defaults: LenisRenderOptions = {
      scrollNode: options.scrollNode ?? defaultWindow(),
      renderScroll: true,
    };
    this.#options = { ...defaults, ...options };

    this.#nativeScrollHandler = (e: Event): void => this.#nativeScroll(e);
    this.#boundHandler = (): void => {
      this.#dirty = true;
    };

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
      if (typeof MutationObserver !== 'undefined' && measureNode) {
        this.#mutationObserver = new MutationObserver(this.#boundHandler);
        this.#mutationObserver.observe(measureNode, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }
      this.#computeBound();
    }
  }

  public register(context: Hades): void {
    this.#context = context;
    context.scrollTo(getScrollPosition(this.#options.scrollNode), 0, true);
  }

  public wheel(_context: Hades, event: HermesEvent): boolean {
    if (
      event.originalEvent.defaultPrevented ||
      (event.originalEvent instanceof WheelEvent && event.originalEvent.ctrlKey) ||
      canScrollWithin(event.originalEvent, this.#options.scrollNode, event.delta)
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

  public preFrame(): void {
    if (this.#dirty) {
      this.#computeBound();
    }
  }

  public recalculate(): void {
    this.#computeBound();
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
    const documentRoot = document.documentElement;
    this.#bound = {
      x: Math.max(
        0,
        (isWindow ? Math.max(node.scrollWidth, documentRoot.scrollWidth) : node.scrollWidth) -
          (isWindow ? window.innerWidth : node.clientWidth),
      ),
      y: Math.max(
        0,
        (isWindow ? Math.max(node.scrollHeight, documentRoot.scrollHeight) : node.scrollHeight) -
          (isWindow ? window.innerHeight : node.clientHeight),
      ),
    };
    this.#dirty = false;
    if (this.#resizeObserver) {
      const current = new Set<Element>([node, ...node.children]);
      for (const previous of this.#observed) {
        if (!current.has(previous)) {
          this.#resizeObserver.unobserve(previous);
        }
      }
      for (const child of current) {
        if (!this.#observed.has(child)) {
          this.#resizeObserver.observe(child);
        }
      }
      this.#observed = current;
    }
  }

  public scroll(context: Hades, _event: HermesEvent): void {
    if (this.#dirty) {
      this.#computeBound();
    }
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

  public scrollTo(context: Hades | null = this.#context): void {
    this.#isValidEvent = true;
    if (!context) {
      return;
    }
    if (this.#dirty) {
      this.#computeBound();
    }
    context.internalAmount = {
      x: Math.min(Math.max(context.internalAmount.x, 0), this.#bound.x),
      y: Math.min(Math.max(context.internalAmount.y, 0), this.#bound.y),
    };
    this.#isValidEvent = true;
  }

  public destroy(): void {
    this.#mutationObserver?.disconnect();
    this.#mutationObserver = null;
    this.#observed.clear();
    this.#context = null;
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
    this.#options.scrollNode.removeEventListener('scroll', this.#nativeScrollHandler);
    node.addEventListener('scroll', this.#nativeScrollHandler);
    this.#options.scrollNode = node;
    if (this.#resizeObserver !== null) {
      this.#resizeObserver.disconnect();
      const measureNode = this.#getMeasureNode();
      if (measureNode !== null) {
        this.#resizeObserver.observe(measureNode);
      }
    }
    this.#mutationObserver?.disconnect();
    const measure = this.#getMeasureNode();
    if (measure) {
      this.#mutationObserver?.observe(measure, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
    this.#observed.clear();
    this.#isValidEvent = false;
    if (this.#interval !== null) {
      window.clearTimeout(this.#interval);
      this.#interval = null;
    }
    this.#computeBound();
    this.#context?.scrollTo(getScrollPosition(node), 0, true);
  }

  public get scrollNode(): HTMLElement | Window {
    return this.#options.scrollNode;
  }

  public get boundaries(): Boundaries {
    if (this.#dirty) {
      this.#computeBound();
    }
    return new Boundaries(0, this.#bound.x, 0, this.#bound.y);
  }
}

export default LenisRender;
